import {GameMode} from "../gamemode";
import {Client} from "../../../server/client";
import {Game, SPAWN_DELAY} from "../../game";
import {Controller} from "../../controller";
import {Piece} from "../../map/piece";
import {okay} from "../../../log";
import {random} from "../../../utils";
import {PacketPipe} from "../../../server/packet";
import {MIN_PLAYERS} from "../../../server/server";

// The minimum updates before the controls can be swapped
const CONTROL_SWAP_MIN: number = parseInt(process.env.CONTROL_SWAP_MIN ?? '15');
// The maximum updates before the controls can be swapped
const CONTROL_SWAP_MAX: number = parseInt(process.env.CONTROL_SWAP_MAX ?? '20');
// The grid width of a control swap map
const CONTROL_SWAP_WIDTH: number = parseInt(process.env.CONTROL_SWAP_WIDTH ?? '12');
// The grid height of a control swap map
const CONTROL_SWAP_HEIGHT: number = parseInt(process.env.CONTROL_SWAP_HEIGHT ?? '22');

export class ControlSwap extends GameMode implements PacketPipe {

    controlClient: Client | null; // The client which is in control or null for none
    nextSwapAt: number; // The amount of updates until we can change the piece
    swapUpdates: number; // The amount of updates passed until change
    spawnUpdates: number; // The amount of updates passed until spawn
    score: number; // The current game score
    nextShape: number[][]; // The next shape to drop down
    controller: Controller; // The controller for the game

    /**
     *  This class contains the logic for the control
     *  swap game mode
     *
     *  @param {Game} game The game instance
     */
    constructor(game: Game) {
        super(game);
        this.controlClient = null; // Set the control client to null
        this.nextSwapAt = 0; // Set the next change at to 0
        this.swapUpdates = 0; // Set the change updates to zero
        this.score = 0; // Set the score to zero
        this.spawnUpdates = 0; // Set the spawn updates to zero
        this.nextShape = this.game.shape(); // Generate the next shape
        // Create a new controller and pipe all the packets to broadcast
        this.controller = new Controller(game, this);
    }

    /**
     *  Initializes the game by setting the
     *  map width and height
     *  @async
     *  @return {Promise<void>} A promise for when its done
     */
    async init(): Promise<void> {
        this.game.map.resize(
            CONTROL_SWAP_WIDTH, /* Control Swap Width */
            CONTROL_SWAP_HEIGHT /* Control Swap Height */
        )
    }

    /**
     *  Spawns a new piece in at the middle of the map
     *  and broadcasts the respective data
     */
    spawn(): void {
        // Get the x position using the center of the map
        const x = Math.floor(this.game.map.width / 2) - Math.floor(this.nextShape.length / 2);
        // Set the y position to the tiles height off of the screen
        const y = -this.nextShape.length;
        this.controller.piece = new Piece(x, y, this.nextShape);
        // Broadcast an ActivePiecePacket
        this.server._broadcast({
            id: 12,
            tile: this.nextShape
        });
        // Update the position of the piece with the clients
        this.controller.moveUpdate();
        this.nextShape = this.game.shape();
        // Broadcast a NextPiecePacket
        this.server._broadcast({
            id: 13,
            tile: this.nextShape
        })
    }

    /**
     *  Updates the game controller and handles when
     *  to change the control and spawning pieces
     *
     *  @async
     *  @return {Promise<void>} A promise for when the update is complete
     */
    async update(): Promise<void> {
        await this.controller.update(); // Update the controller
        if (this.swapUpdates >= this.nextSwapAt) { // If we have reached the change time
            this.swapUpdates = 0; // Reset the swap updates
            this.nextSwapAt = random(CONTROL_SWAP_MIN, CONTROL_SWAP_MAX); // Generate a new swap time
            await this.swap(); // Swap the controls
        } else {
            this.swapUpdates++; // Increase the swap updates
        }
        if (this.controller.piece.empty()) { // If we don't have an active piece
            if (this.spawnUpdates >= SPAWN_DELAY) { // If we have reached the spawn delay
                this.spawnUpdates = 0; // Reset the spawn updates
                this.controller.reset(); // Reset the controls
                this.spawn(); // Spawn a new piece
            } else {
                this.spawnUpdates++; // Increase the spawn updates
            }
        }
    }

    /**
     *  Called when we receive input makes sure that we have a
     *  control client and makes sure the client is the control client
     *  and that the game has started then accepts input
     *
     *  @async
     *  @param {Client} client The client the input is from
     *  @param {string} key The key that was pressed (an alias for the key e.g w = up a = left)
     *  @return {Promise<void>} A promise for when the input has been handled
     */
    async input(client: Client, key: string): Promise<void> {
        if (this.controlClient !== null && this.game.started && this.controlClient.isSelf(client)) {
            if (key === 'left') {
                this.controller.moveLeft = true;
            } else if (key === 'right') {
                this.controller.moveRight = true;
            } else if (key === 'down') {
                this.controller.moveDown = true;
            } else if (key === 'rotate') {
                this.controller.moveRotate = true;
            }
        }
    }

    /**
     *  Swaps the controls between the active players
     *  and stops the game if there is no more active players
     *
     *  @async
     *  @return {Promise<void>} A promise for when the controls are swapped
     */
    async swap(): Promise<void> {
        let players: Client[] = this.server.joined();
        if (players.length < MIN_PLAYERS) { // If we dont have enough players
            okay('GAME', 'Not enough players stopping game.');
            this.game.stop(); // Stop the game
        } else {
            if (players.length === 1) { // If we only have one player
                const player: Client = players[0]; // Get the player
                if (this.controlClient === player) { // Check if they already have the controls
                    return; // Return
                }
            }
            okay('CONTROLS', 'Choosing a new player');
            const index: number = random(0, players.length - 1); // Pick a random player
            const client: Client = players[index]; // Get the client
            this.controlClient = client; // Set the control client
            // Send a ControlPacket to the client
            client._send({id: 9});
            // Broadcast a ControlsPacket to everyone else
            this.server._broadcast({
                id: 10,
                name: client.name,
                uuid: client.uuid,
            }, c => this.controlClient!.isSelf(c));
        }
    }

    /**
     *  Called when a client closes its connection
     *  checks to see if it was the controls client
     *  and if it was then swap the controls
     *
     *  @param {Client} client The client that was closed
     *  @param {string} reason THe client's reason for disconnecting
     *  @return {Promise<void>} A Promise for when it is done
     */
    async close(client: Client, reason: string): Promise<void> {
        if (this.controlClient !== null && this.controlClient.isSelf(client)) {
            await this.swap();
        }
    }

    /**
     *  Called when rows are cleared
     *  updates the score
     *
     *  @async
     *  @return {Promise<void>} A promise for when its done
     */
    async cleared(rows: number[]): Promise<void> {
        const total: number = rows.length;
        let score: number = 0;
        if (total === 4) { // Fours rows = 800 points
            score = 800;
        } else if (total > 0 && total < 4) { // If between 1 and 3 give 100x the amount of rows
            score = 100 * total;
        } else { // Otherwise groups of four
            const amount: number = Math.floor(total / 4);
            if (amount > 0) {
                score = 1200 * amount;
            }
        }
        if (score > 0) { // If we gained score
            this.score += score; // Increase the total score
            for (let client of this.server.joined()) { // Iterate over the clients
                client.score = this.score; // Update the client score
            }
        }
    }

    /**
     *  Pipes all received data to the broadcast
     *  system
     *
     *  @param {Object} packet The packet to pipe
     */
    pipe(packet: any): void {
        this.server._broadcast(packet); // Send everything to broadcast
    }
}