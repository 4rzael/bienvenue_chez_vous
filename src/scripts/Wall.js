import UIConfig from './UIConfig'

export default class Wall {
    /**
     * 
     * @param Phaser.Game game 
     * @param int sizeX The number of tiles in the X axis
     * @param int sizeY The number of tiles in the Y axis
     * @param int sizeX The number of tiles in the X axis
     * @param int sizeX The number of tiles in the X axis
     */
    constructor (game, allFurnitures, {sizeX, sizeY, correctFurniturePositions, unusablePositions=[], doors=[], backgrounds={}}) {
        this.game = game
        this.sizeX = sizeX
        this.sizeY = sizeY
        this.unusablePositions = unusablePositions
        this.correctFurniturePositions = correctFurniturePositions
        this.sprites = []
        this.arrowLeft = undefined
        this.arrowLeftCB = () => {}
        this.arrowRight = undefined
        this.arrowRightCB = () => {}
        this.resetTiles()
        this.spriteClickCB = () => {}
        this.doors = doors // door = {x, y, onClick, visible}
        this.backgrounds = backgrounds
        this.backgroundSprite = undefined
    }

    setRoom (room) {
        this.room = room
    }

    onSpriteClick(cb) {
        this.spriteClickCB = cb
    }

    onArrowRight(cb) {
        this.arrowRightCB = cb
    }

    onArrowLeft(cb) {
        this.arrowLeftCB = cb
    }

    resetTiles () {
        // Creates a 2D array filled with similar objects
        this.tiles = new Array(this.sizeX)
        .fill(0)
        .map((_, i) => (new Array(this.sizeY)
            .fill(0)
            .map(_ => ({
                taken: false,
                by: undefined,
                isLowerLeftCorner: false
            })))
        )
        this.unusablePositions.forEach(([x, y]) => {
            this.tiles[x][y].taken = true
        })
    }

    checkValidPosition(x, y) {
        if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY)
            throw new Error(`Position [${x}, ${y}] is not valid in a ${this.sizeX} by ${this.sizeY} grid`)
    }

    isTileAvailable (x, y) {
        this.checkValidPosition(x, y);
        return !this.tiles[x][y].taken
    }

    canAddFurniture(furniture, x, y) {
        if (!furniture.placeableOnWall && y != 1) return false
        if (furniture.placeableOnWall && y <= 1) return false
        const Xs = new Array(furniture.sizeX).fill(0).map((_, i) => x + i)
        const Ys = new Array(furniture.sizeY).fill(0).map((_, i) => y + i)
        // Check if possible
        for (let x of Xs) {
            for (let y of Ys) {
                try {
                    if (!this.isTileAvailable(x, y))
                        return false
                } catch {
                    return false
                }
            }
        }
        return true
    }

    tryToAddFurniture (furniture, x, y) {
        const Xs = new Array(furniture.sizeX).fill(0).map((_, i) => x + i)
        const Ys = new Array(furniture.sizeY).fill(0).map((_, i) => y + i)
        if (!this.canAddFurniture(furniture, x, y)) return false
        // Then actually fill the tiles
        for (let x of Xs) {
            for (let y of Ys) {
                this.tiles[x][y] = {
                    taken: true,
                    by: furniture,
                    isLowerLeftCorner: false
                }
            }
        }    
        this.tiles[Xs[0]][Ys[0]].isLowerLeftCorner = true
        return true
    }

    getPresentFurniturePositions () {
        let furnitureNames = {}
        for (let x = 0; x < this.sizeX; ++x) {
            for (let y = 0; y < this.sizeY; ++y) {
                const tile = this.tiles[x][y]
                if (tile.isLowerLeftCorner)
                    furnitureNames[tile.by.name] = [x, y]
            }
        }
        return furnitureNames
    }

    getFurnitures() {
        let furnitures = [];

        for (let x = 0; x < this.sizeX; ++x) {
            for (let y = 0; y < this.sizeY; ++y) {
                const tile = this.tiles[x][y]
                if (tile.isLowerLeftCorner)
                    furnitures.push(tile.by);
            }
        }
        return furnitures;
    }
    
    findFurniturePosition (furniture) {
        return this.getPresentFurniturePositions()[furniture.name]
    }

    tryToRemoveFurniture (furniture) {
        const pos = this.findFurniturePosition(furniture)
        if (!pos) return false
        const [X, Y] = pos
        for (let x = X; x < X + furniture.sizeX; ++x) {
            for (let y = Y; y < Y + furniture.sizeY; ++y) {
                this.tiles[x][y] = {
                    taken: false,
                    by: undefined,
                    isLowerLeftCorner: false
                }
            }    
        }
        return true
    }

    printTiles () {
        this.tiles.forEach(row => {
            let str = ''
            row.forEach(tile => { // transposed
                if (tile.taken == false) str += '0 '
                else {
                    if (tile.by != undefined) str += '1 '
                    else str += 'X '
                }
            })
        });
    }

    getMissingFurnitures () {
        return Object.keys(this.correctFurniturePositions)
        .filter(name => !Object.keys(this.getPresentFurniturePositions()).includes(name))
    }
    getCorrectFurnitures () {
        return Object.entries(this.correctFurniturePositions)
        .filter(([name, [x, y]]) => {
            const pos = this.getPresentFurniturePositions()[name]
            return pos && pos[0] == x && pos[1] == y;
        })
        .map(([name, pos]) => name)
    }
    getMisplacedFurnitures () {
        return Object.keys(this.getPresentFurniturePositions())
        .filter(name => !this.getCorrectFurnitures().includes(name))
    }

    enter () {
        if (this.backgrounds[this.room.phase]) {
            this.backgroundSprite = this.game.add.sprite(UIConfig.sceneGrid.positionCenter[0], UIConfig.sceneGrid.positionCenter[1], this.backgrounds[this.room.phase])
        }

        this.doors.forEach(door => {
            const pos = UIConfig.sceneGrid.tileToPixel(door.x + UIConfig.doors.offset[0], door.y + UIConfig.doors.offset[1])
            door.sprite = this.game.add.sprite(pos[0], pos[1], door.texture || 'door')
            door.sprite.setInteractive()
            door.sprite.on('pointerdown', (event) => {
                if (door.onClick)
                    door.onClick(event, door)
            })
            if (door.tooltip) {
                door.sprite.on('pointerover', () => {
                    door.text = this.game.add.text(door.sprite.x, door.sprite.y, door.tooltip, {
                        fontSize: 32,
                        backgroundColor: 0xA0A0A0
                    })
                })
                door.sprite.on('pointerout', () => {
                    if (door.text) {
                        door.text.destroy()
                        door.text = undefined
                    }
                }, this)
            }
        })

        this.getFurnitures().forEach(furniture => {
            let [x, y] = UIConfig.sceneGrid.tileToPixel(this.findFurniturePosition(furniture)[0],
                                                        this.findFurniturePosition(furniture)[1] + furniture.sizeY - 1,
                                                        this.sizeX, this.sizeY)
            let sprite = this.game.add.sprite(x + furniture.sizeX * UIConfig.sceneGrid.tileSize / 2,
                                              y + furniture.sizeY * UIConfig.sceneGrid.tileSize / 2, furniture.getCurrentImage())
            // sprite.setDisplayOrigin(0, 0);
            if (furniture.phase == 'bad') {
                setTimeout(() => {
                    this.game.noteManager.unlockBook()
                }, 1000)
            }
            sprite.setInteractive();
            sprite.name = furniture.name;

            sprite.on('pointerdown', (event) => {
                this.spriteClickCB(event, sprite, furniture)
            });

            this.sprites.push(sprite)
        })

        if (this.room.walls.length > 1) {
            this.arrowLeft = this.game.add.sprite(UIConfig.sceneGrid.positionBottomLeft(this.sizeX, this.sizeY)[0] - UIConfig.sceneGrid.tileSize * 1.5,
                                                  UIConfig.sceneGrid.positionCenter[1],
                                                  'arrow_left')
            this.arrowLeft.setInteractive();
            this.arrowLeft.on('pointerdown', (event) => {
                this.arrowLeftCB(event)
            });
    
            this.arrowRight = this.game.add.sprite(UIConfig.sceneGrid.positionBottomLeft(this.sizeX, this.sizeY)[0] + UIConfig.sceneGrid.tileSize * (this.sizeX + 1.5),
                                                   UIConfig.sceneGrid.positionCenter[1],
                                                   'arrow_right')
            this.arrowRight.setInteractive();
            this.arrowRight.on('pointerdown', (event) => {
                this.arrowRightCB(event)
            });
        }
    }

    exit() {
        console.log('blabalaa', this.getPresentFurniturePositions())
        if (this.backgroundSprite) {
            this.backgroundSprite.destroy()
            this.backgroundSprite = undefined
        }
        this.sprites.forEach(sprite => {
            sprite.destroy()
        })
        this.sprites = []
        if (this.arrowRight) {
            this.arrowRight.destroy()
            this.arrowRight = undefined
        }
        if (this.arrowLeft) {
            this.arrowLeft.destroy()
            this.arrowLeft = undefined
        }

        this.doors.forEach(door => {
            if (door.sprite) {
                door.sprite.destroy()
                door.sprite = undefined
            }
            if (door.text) {
                door.text.destroy()
                door.text = undefined
            }
        })
    }
}
