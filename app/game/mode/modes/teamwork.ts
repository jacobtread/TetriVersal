import {GameMode} from "../gamemode";
import {Client} from "../../../server/client";
import {Controller} from "../../controller";
import {Map as GameMap} from "../../map/map";
import {Piece} from "../../map/piece";
import {random} from "../../../utils";
import Dict = NodeJS.Dict;

interface ClientData {
    client: Client; // The client this data is for
    controller: Controller; // The controller for this client
    spawnUpdates: number; // The spawn updates for this client
    nextShape: number[][]; // The next shape for this client
}

// The amount of updates to wait before spawning a new piece
const SPAWN_DELAY: number = parseInt(process.env.SPAWN_DELAY ?? '3');

export class Teamwork extends GameMode {

    data: Dict<ClientData> = {}; // The data for each client

    /**
     *  Initializes the game by setting the
     *  map width and height
     *  @async
     *  @return {Promise<void>} A promise for when its done
     */
    async init(): Promise<void> {
        const map: GameMap = this.game.map;
        map.width = parseInt(process.env.TEAMWORK_WIDTH ?? '32');
        map.height = parseInt(process.env.TEAMWORK_HEIGHT ?? '22');
    }

    /**
     *  Runs when the game starts creates new data for all
     *  the connected clients and setups up their controllers
     *  to forward all the data to the other clients
     *
     *  @async
     *  @return {Promise<void>} A Promise for when the start is complete
     */
    async start(): Promise<void> {
        const _this: Teamwork = this;
        for (let client of this.server.joined()) { // Iterate over the joined clients
            this.data[client.uuid] = { // Add a new client data
                client,
                // Create a controller
                controller: new Controller(this.game, {
                    pipe(packet: any) {
                        client._send(packet); // Send the packet to its normal destination
                        if (_this.data[client.uuid] === undefined) return; // If that client is closed
                        const clientData: ClientData = _this.data[client.uuid] as ClientData;
                        if (packet.id === 14 || packet.id === 15) { // If its a move/rotate packet
                            const piece: Piece = clientData.controller.piece;
                            // Broadcast a MovingPiecePacket to everyone else
                            _this.server._broadcast({
                                id: 19,
                                uuid: client.uuid,
                                tile: piece.tiles,
                                x: piece.x,
                                y: piece.y,
                            }, c => client.isSelf(c));
                        }
                    }
                }),
                spawnUpdates: 0,
                nextShape: this.game.shape(), // Generate a random next shape
            }
        }
        // Broadcast the ControlPacket to everyone
        this.server._broadcast({id: 9});
    }

    /**
     *  Spawns a new piece in at a random point across
     *  the top of the map
     *
     *  @param {ClientData} data The client data for which to spawn a piece
     */
    spawn(data: ClientData): void {
        // Get the x position using the center of the map
        const x = random(0, this.game.map.width - data.nextShape.length);
        // Set the y position to the tiles height off of the screen
        const y = -data.nextShape.length;
        data.controller.piece = new Piece(x, y, data.nextShape);
        // Broadcast an ActivePiecePacket
        data.client._send({
            id: 12,
            tile: data.nextShape
        });
        // Update the position of the piece with the clients
        data.controller.moveUpdate();
        data.nextShape = this.game.shape();
        // Send a NextPiecePacket
        data.client._send({
            id: 13,
            tile: data.nextShape
        });
    }

    /**
     *  Updates the game controllers for each client
     *  and handles their spawning
     *
     *  @async
     *  @return {Promise<void>} A promise for when the update is complete
     */
    async update(): Promise<void> {
        for (let uuid in this.data) { // Iterate over the data
            if (this.data.hasOwnProperty(uuid)) { // Make sure the uuid exists
                const clientData: ClientData = this.data[uuid] as ClientData;
                await clientData.controller.update(); // Update the controller
                if (clientData.controller.piece.empty()) { // If we don't have an active piece
                    if (clientData.spawnUpdates >= SPAWN_DELAY) { // If we have reached the spawn delay
                        clientData.spawnUpdates = 0;  // Reset the spawn updates
                        clientData.controller.reset(); // Reset the controls
                        this.spawn(clientData);  // Spawn a new piece
                    } else {
                        clientData.spawnUpdates++; // Increase the spawn updates
                    }
                }
            }
        }
    }


    /**
     *  Called when we receive input makes sure that we have a
     *  client linked to receive input and process the input on
     *  that client
     *
     *  @async
     *  @param {Client} client The client the input is from
     *  @param {string} key The key that was pressed (an alias for the key e.g w = up a = left)
     *  @return {Promise<void>} A promise for when the input has been handled
     */
    async input(client: Client, key: string): Promise<void> {
        const uuid: string = client.uuid;
        if (this.data.hasOwnProperty(uuid)) {
            const clientData: ClientData = this.data[uuid] as ClientData;
            if (key === 'left') {
                clientData.controller.moveLeft = true;
            } else if (key === 'right') {
                clientData.controller.moveRight = true;
            } else if (key === 'down') {
                clientData.controller.moveDown = true;
            } else if (key === 'rotate') {
                clientData.controller.moveRotate = true;
            }
        }
    }

    /**
     *  Called when a client closes its connection
     *  delete its data from the data dictionary
     *
     *  @param {Client} client The client that was closed
     *  @param {string} reason THe client's reason for disconnecting
     *  @return {Promise<void>} A Promise for when it is done
     */
    async close(client: Client, reason: string): Promise<void> {
        delete this.data[client.uuid]; // Delete the client
    }

}