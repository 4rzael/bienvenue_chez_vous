import House from "./House"
import NotesInventory from './notesInventory'
import UIConfig from "./UIConfig"
import Indicators from "./indicators"

const DAY_LENGTH = 1.5 * 60 * 1000;
const DAY_PART = DAY_LENGTH / 3;

export default class Player {
    constructor(game, allFurnitures, house) {
        this.game = game
        this.endGame = false;
        this.house = house
        this.house.setPlayer(this)
        this.mentalHealth = 100
        this.energyPerDay = 10
        this.energy = this.energyPerDay
        this.energyUsedByWalking = 0.5
        this.energyUsedByPlacing = 1
        this.energyUsedByBadRoom = 0.5
        this.currentRoom = 'living_room'
        this.currentWall = 0
        this.inventory = []
        this.inventoryPage = 0
        this.notes = new NotesInventory(game);
        this.currentlyDragging = undefined
        this.game.noteManager = this.notes

        this.hud = new Indicators(game);
        this.timeInDayInMs = 0;

        game.input.on('pointermove', pointer => {
            if (this.currentlyDragging) {
                const wall = this.house.getRoom(this.currentRoom).walls[this.currentWall]
                const tilePos = UIConfig.sceneGrid.pixelToTile(pointer.x, pointer.y, wall.sizeX, wall.sizeY)
                console.log(tilePos)
                let clampedTilePos = [...tilePos]
                if (clampedTilePos[0] < 0) clampedTilePos[0] = 0
                if (clampedTilePos[1] < 0) clampedTilePos[1] = 0
                if (clampedTilePos[0] + this.currentlyDragging.furniture.sizeX >= wall.sizeX) clampedTilePos[0] = wall.sizeX - this.currentlyDragging.furniture.sizeX
                if (clampedTilePos[1] + this.currentlyDragging.furniture.sizeY >= wall.sizeY) clampedTilePos[1] = wall.sizeY - this.currentlyDragging.furniture.sizeX
                // Cannot place => red tint
                if (!house.getRoom(this.currentRoom).walls[this.currentWall].canAddFurniture(this.currentlyDragging.furniture, tilePos[0], tilePos[1])) {
                    this.currentlyDragging.sprite.tint = 0xFF0000
                } else {
                    this.currentlyDragging.sprite.tint = 0xFFFFFF
                }
                const pixPos = UIConfig.sceneGrid.tileToPixel(tilePos[0], tilePos[1], wall.sizeX, wall.sizeY)
                this.currentlyDragging.sprite.x = pixPos[0] + this.currentlyDragging.furniture.sizeX * UIConfig.sceneGrid.tileSize / 2;
                this.currentlyDragging.sprite.y = pixPos[1] + (2 - this.currentlyDragging.furniture.sizeY) * UIConfig.sceneGrid.tileSize / 2;
            }
        });

        game.input.on('pointerup', pointer => {
            if (this.currentlyDragging) {
                const wall = this.house.getRoom(this.currentRoom).walls[this.currentWall]
                const tilePos = UIConfig.sceneGrid.pixelToTile(pointer.x, pointer.y, wall.sizeX, wall.sizeY)
                // If in the scene and can place
                if (tilePos[0] >= 0 && tilePos[1] >= 0 && tilePos[0] < wall.sizeX && tilePos[1] < wall.sizeY) {
                    if (this.placeFurniture(this.currentlyDragging.furniture, tilePos[0], tilePos[1])) {
                        this._exitWall()
                        this._enterWall()
                        this._destroyCurrentlyDragging()
                        return
                    }
                }
                // Drag and Drop failed, put it back in the inventory
                this._addCurrentlyDraggingToInventory()
            }
        });
    }

    create() {
        this._refreshInventory()
        this._enterWall()
        this.hud.create();
    }

    addToInventory(furniture) {
        this.inventory.push({
            sprite: undefined,
            furniture: furniture
        })

        this._refreshInventory()
    }

    _refreshInventory() {
        this.inventory.filter(invElem => invElem.sprite).forEach(elem => {
            elem.sprite.destroy()
            elem.sprite = undefined
        })
        if (this.inventoryArrowLeft) {
            this.inventoryArrowLeft.destroy()
            this.inventoryArrowLeft = undefined
        }
        if (this.inventoryArrowRight) {
            this.inventoryArrowRight.destroy()
            this.inventoryArrowRight = undefined
        }
        this.inventory
            .slice(this.inventoryPage * 6, (this.inventoryPage + 1) * 6)
            .forEach((elem, idx) => {
                const pixelPos = UIConfig.inventoryGrid.tileToPixel(idx % 2, ~~(idx / 2), 2, 3)
                elem.sprite = this.game.add.sprite(pixelPos[0], pixelPos[1], elem.furniture.getInventoryImage())
                elem.sprite.setInteractive();
                elem.sprite.on('pointerdown', (event) => {
                    console.log(event)
                    if (this.currentlyDragging) { return; }
                    this._takeFromInventoryToDragging(elem, event.position.x, event.position.y);
                });
            })

        const posLeft = UIConfig.inventoryGrid.tileToPixel(0, 2.8, 2, 3)
        this.inventoryArrowLeft = this.game.add.sprite(posLeft[0], posLeft[1], 'arrow_left')
        if (this.inventoryPage > 0) {
            this.inventoryArrowLeft.setInteractive()
            this.inventoryArrowLeft.on('pointerdown', () => {
                --this.inventoryPage
                this._refreshInventory()
            })
        } else {
            this.inventoryArrowLeft.visible = false
        }

        const posRight = UIConfig.inventoryGrid.tileToPixel(1, 2.8, 2, 3)
        this.inventoryArrowRight = this.game.add.sprite(posRight[0], posRight[1], 'arrow_right')
        if (this.inventoryPage + 1 < this.inventory.length / 6) {
            this.inventoryArrowRight.setInteractive()
            this.inventoryArrowRight.on('pointerdown', () => {
                ++this.inventoryPage
                this._refreshInventory()
            })
        } else {
            this.inventoryArrowRight.visible = false
        }
    }

    _destroyCurrentlyDragging() {
        if (this.currentlyDragging) {
            this.currentlyDragging.sprite.destroy()
            this.currentlyDragging = undefined
        }
    }

    _addCurrentlyDraggingToInventory() {
        if (this.currentlyDragging) {
            this.inventory.unshift({ // Push at front
                furniture: this.currentlyDragging.furniture,
                sprite: undefined
            })
            this._destroyCurrentlyDragging()
        }
        this._refreshInventory()
    }

    _takeFromInventoryToDragging(elem, mousePosX = 0, mousePosY = 0) {
        if (!this.currentlyDragging) {
            this.currentlyDragging = {
                furniture: elem.furniture,
                sprite: this.game.add.sprite(mousePosX, mousePosY, elem.furniture.getCurrentImage())
            }
            elem.sprite.destroy()
            console.log(elem, this.inventory)
            this.inventory = this.inventory.filter(e => e.furniture.name != elem.furniture.name)
            this._refreshInventory()
        }
    }

    _enterWall() {
        console.log('Entering wall')
        const wall = this.house.getRoom(this.currentRoom).walls[this.currentWall]
        wall.printTiles()
        wall.enter()
        wall.onSpriteClick((event, sprite, furniture) => {
            if (this.currentlyDragging) return
            this.currentlyDragging = {
                furniture,
                sprite
            }
            this.takeFurniture(furniture)
        })
        wall.onArrowLeft(() => {
            this.rotateLeft()
        })
        wall.onArrowRight(() => {
            this.rotateRight()
        })
    }

    _exitWall() {
        this.house.getRoom(this.currentRoom).walls[this.currentWall].exit()
    }

    checkHealth() {
        const roomPhase = this.house.getRoom(this.currentRoom).phase
        console.log(this.currentRoom);
        console.error(roomPhase);
        if (roomPhase == 'good') {
            this.takeDamage(-5)
        }
        if (roomPhase == 'bad' || roomPhase == 'very_bad') {
            this.takeDamage(20)
            this.energy -= this.energyUsedByBadRoom
        }
    }

    move(to, wall = 0) {
        console.log('trying to move')
        if (this.house.canTransition(this.currentRoom, to)) {
            this.energy -= this.energyUsedByWalking
            this._exitWall()
            this.currentRoom = to
            this.house.getRoom(this.currentRoom).checkNotes()
            this.currentWall = wall
            this._enterWall()
            this.checkHealth();
            this.checkEndOfDay()
            console.log('move success')
            this.hud.updateEye(this.energy, this.mentalHealth);
            this.updateMusic()
            return true
        }
        console.log('move failed')
        return false
    }

    placeFurniture(furniture, x, y) {
        if (this.house.getRoom(this.currentRoom).walls[this.currentWall].tryToAddFurniture(furniture, x, y)) {
            this.energy -= this.energyUsedByPlacing
            this.checkEndOfDay();
            this.hud.updateEye(this.energy, this.mentalHealth);

            return true
        }
        return false
    }

    takeFurniture(furniture) {
        return this.house.getRoom(this.currentRoom).walls[this.currentWall].tryToRemoveFurniture(furniture)
    }

    rotateRight() {
        console.log('Rotating right')
        this._exitWall()
        this.currentWall = this.house.getRoom(this.currentRoom).previousWall(this.currentWall)
        this._enterWall()
    }

    rotateLeft() {
        console.log('Rotating left')
        this._exitWall()
        this.currentWall = this.house.getRoom(this.currentRoom).nextWall(this.currentWall)
        this._enterWall()
    }

    checkEndOfDay() {
        if (this.energy <= 0 || this.timeInDayInMs > DAY_LENGTH) { // TODO: OR TIMEOUT
            this.sleep()
        }
    }

    sleep() {
        console.log('Sleeping', this.mentalHealth);
        this.house.performMutations()
        this.checkHealth();
        if (this.mentalHealth <= 0 && !this.endGame) {
            this.gameOver();
            return;
        }
        if (this.endGame) {
            return;
        }
        this.energy = this.energyPerDay
        this.house.getRoom(this.currentRoom).checkNotes()
        this.hud.updateEye(this.energy, this.mentalHealth)
        this.hud.nightTime(true);
        this.timeInDayInMs = 0;
        this.updateMusic()
    }

    takeDamage(damage) {
        this.mentalHealth -= damage
        if (this.mentalHealth >= 100) this.mentalHealth = 100
        if (this.mentalHealth <= 0) {
            this.gameOver();
            return;
        }

        console.log('took dmg', this.mentalHealth);
        this.hud.updateEye(this.energy, this.mentalHealth);
    }

    gameOver() {
        if (!this.endGame) {
            this.endGame = true;
            this.hud.nightTime(false);
        }
    }

    update(time, delta) {
        this.hud.update(time, delta);
        this.timeInDayInMs += delta;
        this.hud.updateSun((this.timeInDayInMs * 3) / DAY_LENGTH);
        this.checkEndOfDay();
    }

    updateMusic () {
        if (this.house.getRoom(this.currentRoom).phase == 'good') {
            this.game.musicPlayer.switchToGood()
        }
        else if (this.house.getRoom(this.currentRoom).phase == 'bad') {
            this.game.musicPlayer.switchToVeryBad()
        }
        else if (this.house.getRoom(this.currentRoom).getBadFurnitures().length > 0) {
            this.game.musicPlayer.switchToBad()
        }
        else {
            this.game.musicPlayer.switchToNeutral()
        }
    }
}
