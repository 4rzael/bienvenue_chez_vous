import Furniture from "./Furniture"

export default class Room {
    constructor (game, allFurnitures, walls) {
        this.game = game
        this.walls = walls
        this.phase = 'neutral'
        this.allFurnitures = allFurnitures
        this.validated = false
        this.walls.forEach(wall => wall.setRoom(this))
    }

    static phases () {
        return ['bad', 'neutral', 'good']
    }

    static validatePhaseName(phase) {
        if (Room.phases().indexOf(phase) == -1) {
            throw new Error(`${phase} is not a valid room phase name`)
        }
    }

    getAllCorrectFurnitures() {
        return this.walls
            .map(wall => wall.getCorrectFurnitures())
            .reduce((arr1, arr2) => arr1.concat(arr2), [])
    }

    getAllMisplacedFurnitures() {
        return this.walls
            .map(wall => wall.getMisplacedFurnitures())
            .reduce((arr1, arr2) => arr1.concat(arr2), [])
    }

    getAllMissingFurnitures() {
        return this.walls
            .map(wall => wall.getMissingFurnitures())
            .reduce((arr1, arr2) => arr1.concat(arr2), [])
            .filter(furnitureName => !this.getAllMisplacedFurnitures().includes(furnitureName))
    }

    getAllFurnitures () {
        return this.walls
        .map(wall => wall.getFurnitures())
        .reduce((arr1, arr2) => arr1.concat(arr2), [])
    }

    getBadFurnitures () {
        return this.getAllFurnitures()
        .filter(f => f.phase == 'bad')
    }

    _applyFurnituresMutations() {
        this.getAllMisplacedFurnitures()
        .forEach(name => {
            console.log('Worsening furniture', name)
            this.allFurnitures[name].worsen()
        })

        this.getAllCorrectFurnitures()
        .forEach(name => {
            console.log('Improving furniture', name)
            this.allFurnitures[name].improve()
        })
    }

    checkNotes () {
        this.getAllCorrectFurnitures()
        .map(fName => this.allFurnitures[fName])
        .filter(f => !f.checkedPostIt)
        .forEach(f => {
            this.game.noteManager.halfDispense()
            f.checkedPostIt = true
        })
    }

    applyMutations () {
        this._applyFurnituresMutations()
        const theoreticalNbFurnitures = this.walls
            .map(wall => Object.keys(wall.correctFurniturePositions).length)
            .reduce((a, b) => a + b, 0)

        const errors = this.getAllMisplacedFurnitures().length + this.getAllMissingFurnitures().length
        const worsenProbability = errors / theoreticalNbFurnitures * 0.5
        if (Math.random() <= worsenProbability) {
            this.worsen()
        }
        console.log('Mutating room.')
        console.log(`There shoud be ${theoreticalNbFurnitures} furnitures`)
        console.log(`There are be ${this.getAllCorrectFurnitures().length} correct furnitures`)
        if (Object.keys(this.getAllCorrectFurnitures()).length >= theoreticalNbFurnitures) {
            this.improve()
        }
        if (Object.keys(this.getAllCorrectFurnitures()).length >= theoreticalNbFurnitures / 2) {
            this.validated = true
        }
    }

    worsen() {
        const phase = this.phase
        Room.validatePhaseName(this.phase)
        if (phase === 'neutral') {
            this.phase = 'bad';
        } else if (phase === 'good') {
            this.phase = 'neutral';
        }
        console.log('phase is now', this.phase);
        //if (!this.phase) this.phase = phase
    }

    improve() {
        const phase = this.phase
        Room.validatePhaseName(this.phase)
        if (phase === 'neutral') {
            this.phase = 'good';
        } else if (phase === 'bad') {
            this.phase = 'neutral';
        }
        console.log('phase is now', this.phase);
        //if (!this.phase) this.phase = phase
    }


    nextWall(wall) {
        return (wall + this.walls.length + 1) % this.walls.length
    }

    previousWall(wall) {
        return (wall + this.walls.length - 1) % this.walls.length
    }
};
