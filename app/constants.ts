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

const UPDATE_DELAY: number = parseInt(process.env.UPDATE_DELAY ?? '200');

const DEATH_TIMEOUT: number = parseInt(process.env.DEATH_TIMEOUT ?? '1000');

// (SPAWN/PLACE)_DELAY * PLACE_DELAY = Theoretical place delay (ignoring system lag)
const SPAWN_DELAY: number = parseInt(process.env.SPAWN_DELAY ?? '3');
const PLACE_DELAY: number = parseInt(process.env.PLACE_DELAY ?? '1.5');

const PORT: number = parseInt(process.env.PORT ?? '80');
// The minimum players required to start
const MIN_PLAYERS: number = parseInt(process.env.MIN_PLAYERS ?? '1');
// Time before the game starts in seconds
const TIME_TILL_START: number = parseInt(process.env.TIME_TILL_START ?? '2');

export {
    TETRIMINIOS,
    UPDATE_DELAY,
    SPAWN_DELAY,
    PLACE_DELAY,
    DEATH_TIMEOUT,
    PORT,
    MIN_PLAYERS,
    TIME_TILL_START,
}