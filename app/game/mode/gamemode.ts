import {Server} from "../../server/server";
import {Client} from "../../server/client";
import {Game} from "../game";

export const GAME_MODES = [
    {mode: 0, name: "Control Swap"},
    {mode: 1, name: "Teamwork"}
]

export class GameMode {

    server: Server; // The game server
    game: Game; // The game instance

    /**
     *  This class contains the structure
     *  for the gamemode system
     *
     *  @param {Game} game The game instance
     */
    constructor(game: Game) {
        this.game = game;
        this.server = game.server;
    }

    /**
     *  Called when the game is being setup
     *
     *  @async
     */
    async init(): Promise<void> {
    }

    /**
     *  Called when a player joins the game
     *
     *  @async
     *  @param {Client} client The client that joined
     */
    async join(client: Client): Promise<void> {
    }

    /**
     *  Called when the game starts
     *
     *  @async
     */
    async start(): Promise<void> {
    }

    /**
     *  Called when the game stops
     *
     *  @async
     */
    async stop(): Promise<void> {
    }

    /**
     *  Called when the game updates
     *
     *  @async
     */
    async update(): Promise<void> {
    }

    /**
     *  Called when a player sends input
     *
     *  @async
     *  @param {Client} client The client that joined
     *  @param {string} key The key that was pushed
     */
    async input(client: Client, key: string): Promise<void> {
    }

    /**
     *  Called when a client closes its connection
     *
     *  @async
     *  @param {Client} client The client that joined
     *  @param {string} reason The reason for closing
     */
    async close(client: Client, reason: string): Promise<void> {
    }

    /**
     *  Called when rows are cleared
     *
     *  @async
     *  @param {number} rows The rows that were cleared
     */
    async cleared(rows: number[]): Promise<void> {
    }

}