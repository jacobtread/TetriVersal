const TETRIMINIOS = [
    [
        [1, 1],
        [1, 1]
    ],
    [
        [2, 2, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    [
        [0, 3, 0],
        [3, 3, 3],
        [0, 0, 0]
    ],
    [
        [0, 4, 0],
        [0, 4, 0],
        [0, 4, 4]
    ],
    [
        [5, 0, 0],
        [5, 5, 0],
        [0, 5, 0]
    ],
    [
        [0, 6, 0],
        [6, 6, 0],
        [6, 0, 0]
    ]
];

const UPDATE_DELAY = 200;

// (SPAWN/PLACE)_DELAY * PLACE_DELAY = Theoretical place delay (ignoring system lag)
const SPAWN_DELAY = 3;
const PLACE_DELAY = 1.5;

export {TETRIMINIOS, UPDATE_DELAY, SPAWN_DELAY, PLACE_DELAY}