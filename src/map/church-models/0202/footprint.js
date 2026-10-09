// Metres in the model frame, traced from pinned building:26569630-1473.
// Includes the St John Bosco school spine, chapel spur and Guze Howard wing.
export const COMPLEX_FOOTPRINT = [
  [-29.9482, -49.9948], [-19.5352, -50.3095], [-16.8676, -6.6333],
  [15.8377, -6.6333], [16.8676, 6.6333], [-10.7456, 8.6358],
  [-10.2021, 14.7292], [-13.2488, 15.001], [-12.1975, 31.9509],
  [-2.614, 30.9425], [-2.3994, 35.0691], [15.8807, 33.4385],
  [15.9951, 31.2786], [48.0997, 26.2652], [52.255, 41.8635],
  [-24.4128, 49.9306], [-25.2639, 12.8483], [-27.4237, 12.7338],
  [-28.4035, -13.7422], [-26.4368, -14.0712]
];

// Remove the projecting chapel from the school roof, keeping its junction.
export const SCHOOL_FOOTPRINT = COMPLEX_FOOTPRINT.filter((_, index) => index !== 3 && index !== 4);
