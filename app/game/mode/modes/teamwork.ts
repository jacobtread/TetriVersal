import {GameMode} from "../gameMode";
import {Controller} from "../../controller";
import {GameMap} from "../../map/map";

class Teamwork extends GameMode {

    controllers: Controller[] = [];

    async init(): Promise<void> {
        const map: GameMap = this.game.map;
        map.width = 12;
        map.height = 22;
    }

}