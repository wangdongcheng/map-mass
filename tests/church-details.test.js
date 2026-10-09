import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import {
  getMassesInProgress,
  getNextMassStartingSoon,
  getUpcomingMasses
} from "../src/data/current-mass.js";

class FakeElement {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.events = {};
    this.style = { setProperty() {}, removeProperty() {} };
    const classes = new Set();
    this.classList = {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle(name, active) { active ? classes.add(name) : classes.delete(name); }
    };
  }
  append(...nodes) {
    for (const node of nodes) {
      if (node.parent) node.parent.children = node.parent.children.filter((child) => child !== node);
      node.parent = this;
      this.children.push(node);
    }
  }
  prepend(node) { this.children.unshift(node); node.parent = this; }
  setAttribute(key, value) { this.attributes[key] = value; }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(key, handler) { this.events[key] = handler; }
  removeEventListener(key) { delete this.events[key]; }
  showModal() { this.open = true; }
  close() { this.open = false; this.events.close?.(); }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
    this.parent = null;
  }
  contains(node) { return this === node || this.children.some((child) => child.contains(node)); }
  closest(selector) {
    const classes = selector.split(",").map((value) => value.trim().slice(1));
    if (classes.some((name) => this.className?.split(" ").includes(name))) return this;
    return this.parent?.closest(selector) ?? null;
  }
  getBoundingClientRect() { return { left: 100, top: 100, bottom: 124, width: 24, height: 24 }; }
  querySelectorAll(selector) {
    return this.children.flatMap((child) => [
      ...(child.className === selector.slice(1) ? [child] : []),
      ...child.querySelectorAll(selector)
    ]);
  }
}

function fixture({ languages = ["English", "Maltese", "Italian"], masses, photoUrl = null, photoUrls = photoUrl ? [photoUrl] : [], now = "2026-10-09T07:30:00Z" } = {}) {
  const markers = [];
  class Marker {
    constructor({ element }) { this.element = element; markers.push(this); }
    setLngLat() { return this; }
    addTo() { return this; }
    remove() {}
  }
  const body = new FakeElement("body");
  const document = new FakeElement("document");
  Object.assign(document, { body, createElement: (tag) => new FakeElement(tag), activeElement: null });
  const timers = new Map();
  let clock = 0, nextTimer = 0;
  const advance = (milliseconds) => {
    const end = clock + milliseconds;
    while (true) {
      const pending = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!pending) break;
      const [id, timer] = pending;
      clock = timer.at; timers.delete(id); timer.callback();
    }
    clock = end;
  };
  const context = vm.createContext({
    Marker, Element: FakeElement,
    getMassesInProgress, getNextMassStartingSoon, getUpcomingMasses,
    isChurchBookmarked: () => false,
    toggleChurchBookmark() {}, getChurchPhotoUrl: () => photoUrl,
    getChurchPhotoUrls: () => photoUrls,
    document,
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } },
    window: {
      clearTimeout(id) { timers.delete(id); },
      setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, at: clock + delay }); return id; }
    }
  });
  for (const path of ["../src/ui/church-details.js", "../src/map/add-church-marker.js"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8")
      .replace(/import[\s\S]*?from\s+"[^"]+";/g, "")
      .replace(/export function/g, "function");
    vm.runInContext(source, context);
  }
  const container = new FakeElement("div");
  const removalHandlers = [];
  const map = { getContainer: () => container, once: (_, handler) => removalHandlers.push(handler) };
  const schedule = [{ dayNames: ["Friday"], entries: [{ time: "09:00" }] }];
  const church = {
    id: "test", name: "Test", locality: "Malta", coordinates: [14, 36],
    hasMassTimes: languages.length > 0, languages,
    masses: masses ?? [
      { day: "Friday", time: "09:00", language: "English" },
      { day: "Thursday", time: "18:30", language: "Maltese" },
      { day: "Monday", time: "12:00", language: "Italian" }
    ],
    massTimes: schedule,
    massTimesByLanguage: Object.fromEntries(languages.map((language) => [language, schedule]))
  };
  let selections = 0;
  const controller = context.addChurchMarker(map, church, () => selections++);
  return { controller, container, body, document, markers, advance, timers, removalHandlers, getSelections: () => selections };
}

test("photo click opens the full source without selecting the church and cleans up on dismissal", () => {
  const photoUrl = "/photos/test.jpg";
  const { controller, container, body, getSelections } = fixture({ photoUrl });
  controller.showDetails();
  const button = container.querySelectorAll(".church-mass-bubble__photo-button")[0];
  assert.equal(button.tag, "button");
  assert.equal(button.attributes["aria-haspopup"], "dialog");
  let stopped = false;
  const open = () => button.events.click({ stopPropagation() { stopped = true; } });
  open();
  assert.equal(stopped, true);
  assert.equal(getSelections(), 0);
  const dialog = body.children[0];
  assert.equal(dialog.tag, "dialog");
  assert.equal(dialog.open, true);
  const photo = dialog.querySelectorAll(".church-photo-viewer__image")[0];
  assert.equal(photo.src, photoUrl);
  assert.equal(photo.alt, "Test, Malta");
  assert.equal(dialog.querySelectorAll(".church-photo-viewer__next").length, 0);
  dialog.events.click({ target: photo });
  assert.equal(dialog.open, true);
  dialog.querySelectorAll(".church-photo-viewer__close")[0].events.click();
  assert.equal(body.children.length, 0);
  open();
  body.children[0].events.click({ target: body.children[0] });
  assert.equal(body.children.length, 0);
  open();
  body.children[0].close(); // Native dialog Escape dismissal dispatches close.
  assert.equal(body.children.length, 0);
});

test("gallery starts on the card photo and cycles through photos with buttons and arrow keys", () => {
  const photoUrls = ["/photos/cover.jpg", "/photos/original.jpg", "/photos/side.png"];
  const { controller, container, body, getSelections } = fixture({
    photoUrl: photoUrls[0], photoUrls
  });
  controller.showDetails();
  container.querySelectorAll(".church-mass-bubble__photo-button")[0]
    .events.click({ stopPropagation() {} });
  const dialog = body.children[0];
  const photo = dialog.querySelectorAll(".church-photo-viewer__image")[0];
  const counter = dialog.querySelectorAll(".church-photo-viewer__counter")[0];
  const next = dialog.querySelectorAll(".church-photo-viewer__next")[0];
  const previous = dialog.querySelectorAll(".church-photo-viewer__previous")[0];
  assert.equal(photo.src, photoUrls[0]);
  assert.equal(counter.textContent, "1 / 3");
  previous.events.click();
  assert.equal(photo.src, photoUrls[2]);
  assert.equal(counter.textContent, "3 / 3");
  next.events.click();
  next.events.click();
  assert.equal(photo.src, photoUrls[1]);
  for (const [key, expected] of [["ArrowRight", 2], ["ArrowLeft", 1]]) {
    let prevented = false;
    let stopped = false;
    dialog.events.keydown({ key,
      preventDefault() { prevented = true; }, stopPropagation() { stopped = true; }
    });
    assert.equal(photo.src, photoUrls[expected]);
    assert.equal(prevented, true);
    assert.equal(stopped, true);
  }
  dialog.events.keydown({ key: "Tab" });
  assert.equal(photo.src, photoUrls[1]);
  assert.equal(getSelections(), 0);
  dialog.close();
  container.querySelectorAll(".church-mass-bubble__photo-button")[0]
    .events.click({ stopPropagation() {} });
  assert.equal(body.children[0].querySelectorAll(".church-photo-viewer__image")[0].src, photoUrls[0]);
});

test("marker initializes before lazy details and preserves selection and removal lifecycle", () => {
  const { controller, container, document, timers, removalHandlers, getSelections } = fixture();
  assert.equal(controller.marker.element.children.length, 1);
  controller.showDetails();
  const bubble = container.querySelectorAll(".church-mass-bubble")[0];
  assert.ok(bubble);
  bubble.events.click();
  assert.equal(getSelections(), 1);
  removalHandlers.forEach((handler) => handler());
  assert.equal(container.querySelectorAll(".church-mass-bubble").length, 0);
  assert.equal(document.events.click, undefined);
  assert.equal(timers.size, 0);
});

for (const [status, time, icon] of [
  ["in progress", "09:00", "current-mass-indicator__pie"],
  ["starting soon", "09:40", "current-mass-indicator__hourglass"]
]) {
  const setup = () => {
    const f = fixture({ masses: [{ day: "Friday", time, language: "English" }] });
    const anchor = f.markers.find((marker) => marker.element.className === "current-mass-marker-anchor").element;
    const trigger = anchor.children[0];
    assert.equal(trigger.hidden, false);
    assert.equal(trigger.children.find((child) => child.className === icon).hidden, false);
    assert.match(trigger.attributes["aria-label"], /Show church details/);
    const isOpen = () => f.controller.marker.element.classList.contains("is-bubble-open");
    return { ...f, anchor, trigger, isOpen };
  };

  test(`${status} indicator: mouse hover shows a temporary card without selecting the church`, () => {
    const f = setup();
    f.anchor.events.pointerenter({ pointerType: "mouse", clientX: 112, clientY: 80 });
    f.advance(999);
    assert.equal(f.isOpen(), false);
    f.advance(1);
    assert.equal(f.isOpen(), true);
    assert.equal(f.getSelections(), 0);
    f.anchor.events.pointerleave();
    f.advance(4999);
    assert.equal(f.isOpen(), true);
    f.advance(1);
    assert.equal(f.isOpen(), false);
  });

  test(`${status} indicator: clicking during the hover delay expires exactly five seconds after the click`, () => {
    const f = setup();
    f.anchor.events.pointerenter({ pointerType: "mouse", clientX: 112, clientY: 80 });
    f.advance(200);
    f.trigger.events.click();
    assert.equal(f.isOpen(), true);
    assert.equal(f.getSelections(), 0);
    f.advance(4999);
    assert.equal(f.isOpen(), true);
    f.advance(1);
    assert.equal(f.isOpen(), false, "a pending hover must not reopen the card or extend its timer");
  });

  test(`${status} indicator: touch requires a tap and other-page clicks dismiss the card`, () => {
    const f = setup();
    f.anchor.events.pointerenter({ pointerType: "touch", clientX: 112, clientY: 80 });
    f.advance(1000);
    assert.equal(f.isOpen(), false);
    f.trigger.events.click();
    assert.equal(f.isOpen(), true);
    assert.equal(f.getSelections(), 0);
    const cross = f.controller.marker.element.children.find((child) => child.className === "church-cross");
    for (const target of [cross, f.trigger.children.find((child) => child.className === icon)]) {
      f.document.events.click({ target });
      assert.equal(f.isOpen(), true, "crosses and indicator contents must not dismiss the card");
    }
    f.document.events.click({ target: new FakeElement("button") });
    assert.equal(f.isOpen(), false, "a click outside the map must also dismiss the card");
    assert.equal(f.timers.size, 0);
    f.trigger.events.click();
    f.advance(5000);
    assert.equal(f.isOpen(), false, "a touch-opened card must also expire after five seconds");
  });

  test(`${status} indicator: clicking the detail card retains selection and the persistent side card`, () => {
    const f = setup();
    f.trigger.events.click();
    const bubble = f.controller.marker.element.children.find((child) => child.className === "church-mass-bubble");
    f.document.events.click({ target: bubble });
    assert.equal(f.isOpen(), true);
    bubble.events.click();
    assert.equal(f.getSelections(), 1);
    f.controller.showDetails(); // Church navigation moves the selected card to the side.
    assert.equal(bubble.parent, f.container);
    assert.equal(bubble.classList.contains("is-bubble-focused"), true);
    f.advance(5000);
    assert.equal(bubble.classList.contains("is-bubble-focused"), true);
  });
}

test("each language tab shows its next Mass above the map actions", () => {
  const { controller, container } = fixture();
  controller.showDetails();
  controller.updateCurrentMassStatus(new Date("2026-10-01T10:00:00Z"));
  const bubble = container.querySelectorAll(".church-mass-bubble")[0];
  const panels = bubble.querySelectorAll(".church-language-panel");
  assert.deepEqual(panels.map((panel) => panel.children.at(-1).textContent), [
    "Next Mass: Tomorrow 9am", "Next Mass: today 6:30pm", "Next Mass: Monday 12pm"
  ]);
  bubble.querySelectorAll(".church-language-tab")[1].events.click({ stopPropagation() {} });
  assert.equal(panels[0].hidden, true);
  assert.equal(panels[1].hidden, false);
  assert.equal(bubble.children.at(-1).className, "church-mass-bubble__actions");
  controller.updateCurrentMassStatus(new Date("2026-10-01T17:00:00Z"));
  assert.equal(panels[1].children.at(-1).textContent, "Next Mass: Thursday 6:30pm");
  controller.updateCurrentMassStatus(new Date("2026-10-01T22:30:00Z"));
  assert.equal(panels[0].children.at(-1).textContent, "Next Mass: today 9am");
});

test("single-language card formats midnight and cards without schedules omit next Mass", () => {
  const { controller, container } = fixture({
    languages: ["English"],
    masses: [{ day: "Friday", time: "00:05", language: "English" }]
  });
  controller.showDetails();
  controller.updateCurrentMassStatus(new Date("2026-10-01T10:00:00Z"));
  assert.equal(container.querySelectorAll(".church-mass-bubble__next-mass")[0].textContent,
    "Next Mass: Tomorrow 12:05am");
  const empty = fixture({ languages: [], masses: [] });
  empty.controller.showDetails();
  assert.equal(empty.container.querySelectorAll(".church-mass-bubble__next-mass").length, 0);
});
