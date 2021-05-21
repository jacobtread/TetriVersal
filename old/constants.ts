import {GameModeRef} from "./server/packets";

require('dotenv').config();

// The tiles structures of each tetrimino
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

// The list of the available game modes
const GAME_MODES: GameModeRef[] = [
    {id: 0, name: 'Control Swap'},
    {id: 1, name: 'Team work'},
]
// The delay between each update
const UPDATE_DELAY: number = parseInt(process.env.UPDATE_DELAY ?? '50');
// The delay before keep alive connections will die
const DEATH_TIMEOUT: number = parseInt(process.env.DEATH_TIMEOUT ?? '1000');
// MOVE_DELAY * UPDATE_DELAY = Theoretical spawn delay (ignoring system lag)
const MOVE_DELAY: number = parseInt(process.env.MOVE_DELAY ?? '2');
// SPAWN_DELAY * UPDATE_DELAY = Theoretical spawn delay (ignoring system lag)
const SPAWN_DELAY: number = parseInt(process.env.SPAWN_DELAY ?? '3');
// PLACE_DELAY * UPDATE_DELAY = Theoretical place delay (ignoring system lag)
const PLACE_DELAY: number = parseInt(process.env.PLACE_DELAY ?? '1.5');
// The port the server runs on
const PORT: number = parseInt(process.env.PORT ?? '80');
// The minimum players required to start
const MIN_PLAYERS: number = parseInt(process.env.MIN_PLAYERS ?? '2');
// Time before the game starts in seconds
const TIME_TILL_START: number = parseInt(process.env.TIME_TILL_START ?? '2');
// CONTROL SWAP MIN DELAY
const CONTROL_SWAP_MIN: number = parseInt(process.env.CONTROL_SWAP_MIN ?? '15');
// CONTROL SWAP MAX DELAY
const CONTROL_SWAP_MAX: number = parseInt(process.env.CONTROL_SWAP_MAX ?? '20');
// 0 = Control Swap 1 = Teamwork
const GAME_MODE_ID: number = parseInt(process.env.GAME_MODE_ID ?? '0');

export {
    TETRIMINIOS,
    UPDATE_DELAY,
    SPAWN_DELAY,
    PLACE_DELAY,
    DEATH_TIMEOUT,
    PORT,
    MIN_PLAYERS,
    TIME_TILL_START,
    CONTROL_SWAP_MIN,
    CONTROL_SWAP_MAX,
    MOVE_DELAY,
    GAME_MODE_ID,
    GAME_MODES
}