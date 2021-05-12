import {GameMode} from "../gameMode";
import {Game} from "../../game";

class ControlSwap extends GameMode {

    async start(): Promise<void> {

    }

    async update(): Promise<void> {
        const game: Game | null = this.game;
    }

    async stop(): Promise<void> {


    }

}

export {ControlSwap}