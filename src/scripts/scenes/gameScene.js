import Wall from '../Wall';
import Furniture from '../Furniture';
import House from '../House';
import Player from '../Player';
import UIConfig from '../UIConfig';
import MusicPlayer from '../MusicPlayer';

const CELL_SIZE = 96;
const GRID_WIDTH = 1248;
const GRID_HEIGTH = 768;
const POSGRID_X = 1920 * 0.4;
const POSGRID_Y = 1080 * 0.4;
const OFFSETGRID_WIDTH = POSGRID_X - (GRID_WIDTH / 2);
const OFFSETGRID_HEIGTH = POSGRID_Y - (GRID_HEIGTH / 2);

const INV_WIDTH = CELL_SIZE * 4;
const INV_HEIGHT = CELL_SIZE * 8;
const INV_PAGESIZE = 8;
const INV_X = OFFSETGRID_WIDTH + GRID_WIDTH + CELL_SIZE + (INV_WIDTH / 2);
const INV_Y = POSGRID_Y + (CELL_SIZE / 2);
const OFFSETINV_WIDTH = INV_X - (INV_WIDTH / 2);
const OFFSETINV_HEIGTH = INV_Y - (INV_HEIGHT / 2);

export default class GameScene extends Phaser.Scene {
    debugGrid;
    mainGrid;
    testWall;
    furnitureList;
    inventory;
    inventoryPage;

    roomSprites;
    invSprites;
    pickUp;
    pickedSprite;

    constructor() {
        super({ key: 'GameScene' });
        this.furnitureList = [];
        this.inventory = [];
        this.inventoryPage = 0;
        this.roomSprites = [];
        this.invSprites = [];
        this.pickUp = '';
    }

    addfurniture(furniture) {
        this.furnitureList[furniture.name] = new Furniture(this, furniture);
        this.inventory.push(furniture.name);
        return this.furnitureList[furniture.name]
    }

    buildImageNames (path, baseFilename) {
        const baseFurnitureName = path + '/furnitures/' + baseFilename
        const baseInventoryName = path + '/inventory/' + baseFilename
        return {
            good: baseFurnitureName + '_good.png',
            neutral: baseFurnitureName + '_neutral.png',
            bad: baseFurnitureName + '_bad.png',
            inventory: baseInventoryName + '_neutral.png'
        }
    }

    preload() {
        const furnituresData = {
            bibliotheque_bibliotheque: {sizeX: 5, sizeY: 6, placeableOnWall: false},
            bibliotheque_bureau: {sizeX: 4, sizeY: 3, placeableOnWall: false},
            bibliotheque_canape: {sizeX: 2, sizeY: 3, placeableOnWall: false},
            chambre_armoire: {sizeX: 3, sizeY: 5, placeableOnWall: false},
            chambre_chevet: {sizeX: 2, sizeY: 3, placeableOnWall: false},
            chambre_lit: {sizeX: 3, sizeY: 3, placeableOnWall: false},
            chambre_miroir: {sizeX: 2, sizeY: 4, placeableOnWall: false},
            cuisine_cuisiniere: {sizeX: 3, sizeY: 3, placeableOnWall: false},
            cuisine_evier: {sizeX: 2, sizeY: 3, placeableOnWall: false},
            cuisine_frigo: {sizeX: 2, sizeY: 4, placeableOnWall: false},
            cuisine_pendule: {sizeX: 2, sizeY: 2, placeableOnWall: true},
            cuisine_placard: {sizeX: 7, sizeY: 2, placeableOnWall: true},
            cuisine_table: {sizeX: 5, sizeY: 3, placeableOnWall: false},
            salon_canape: {sizeX: 4, sizeY: 3, placeableOnWall: false},
            salon_etagere: {sizeX: 3, sizeY: 4, placeableOnWall: false},
            salon_gramophone: {sizeX: 2, sizeY: 4, placeableOnWall: false},
            salon_lampe: {sizeX: 1, sizeY: 4, placeableOnWall: false},
            salon_plante: {sizeX: 2, sizeY: 3, placeableOnWall: false},
            salon_portemanteau: {sizeX: 1, sizeY: 5, placeableOnWall: false},
            salon_tableau: {sizeX: 2, sizeY: 2, placeableOnWall: true},
            salon_tele: {sizeX: 3, sizeY: 4, placeableOnWall: false},
            sdb_baignoire: {sizeX: 6, sizeY: 6, placeableOnWall: false},
            sdb_lavabo: {sizeX: 2, sizeY: 4, placeableOnWall: false},
            sdb_miroir: {sizeX: 2, sizeY: 2, placeableOnWall: true},
            sdb_toilettes: {sizeX: 2, sizeY: 3, placeableOnWall: false}
        }
        this.furnitures = Object.entries(furnituresData).map(([furniture, info]) => {
            return this.addfurniture({
                name: furniture,
                sizeX: info.sizeX, sizeY: info.sizeY,
                placeableOnWall: info.placeableOnWall,
                images: this.buildImageNames('assets/img/sprites', furniture)
            })
        })

        console.log('initial inv', this.inventory);
        console.log('furniture lib', this.furnitureList);
        
        this.house = new House(this, this.furnitureList)
        this.player = new Player(this, this.furnitureList, this.house);

        this.furnitures.map(f => {
            this.player.addToInventory(f)
        })
    }
    
    /**
     * 
     * @param {x, y} pos 
     * @param {{x, y}, width, height} area 
     */
    isInArea(pos, area) {
        return ((pos.x >= area.pos.x && pos.x <= area.pos.x + area.width)
        && (pos.y >= area.pos.y && pos.y <= area.pos.y + area.heigth));
    }
    
    create() {
        this.debugGrid = this.add.grid(
            UIConfig.sceneGrid.positionCenter[0],
            UIConfig.sceneGrid.positionCenter[1],
            UIConfig.sceneGrid.size(13, 8)[0], UIConfig.sceneGrid.size(13, 8)[1],
            UIConfig.sceneGrid.tileSize, UIConfig.sceneGrid.tileSize,
            0xcacaca, 1, 0x0000FF);

        this.player.create();
        this.musicPlayer = new MusicPlayer(this)

        this.house._upgradeLvL1()
        this.house._upgradeLvL2()
        this.house._upgradeLvL3()

        this.input.on('pointerdown', event => {
            console.log(event.position)
            UIConfig.sceneGrid.pixelToTile(event.position.x, event.position.y, 13, 8)
        });
    }

    update(time, delta) {
        this.player.update(time, delta);
    }
}
