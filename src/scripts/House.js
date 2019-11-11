import Room from './Room'
import Wall from './Wall'

export default class House {
    constructor (game, allFurnitures) {
        this.game = game
        this.player = undefined
        this.rooms = {
            living_room: {room: new Room(game, allFurnitures, [
                new Wall(game, allFurnitures, {
                    sizeX: 11, sizeY: 8,
                    correctFurniturePositions: {'salon_etagere': [4, 1]},
                    doors: [{x: 2, y: 1, onClick: (() => { this.player.move('bathroom') }), texture: 'invisible_door', tooltip: 'Entrer'}],
                    backgrounds: {'good': 'living_room_0_good', 'neutral': 'living_room_0_neutral', 'bad': 'living_room_0_bad'}}),
                new Wall(game, allFurnitures, {
                    sizeX: 11, sizeY: 8,
                    correctFurniturePositions: {'salon_plante': [0, 1], 'salon_canape': [2, 1], 'salon_lampe': [6, 1], 'salon_tableau': [3, 5]},
                    doors: [{x: 8, y: 1, onClick: (() => { this.player.move('kitchen') }), texture: 'invisible_door', tooltip: 'Entrer'}],
                    backgrounds: {'good': 'living_room_1_good', 'neutral': 'living_room_1_neutral', 'bad': 'living_room_1_bad'}}),
                new Wall(game, allFurnitures, {
                    sizeX: 11, sizeY: 8,
                    correctFurniturePositions: {'salon_portemanteau': [2, 1]},
                    backgrounds: {'good': 'living_room_2_good', 'neutral': 'living_room_2_neutral', 'bad': 'living_room_2_bad'}}),
                new Wall(game, allFurnitures, {
                    sizeX: 11, sizeY: 8,
                    correctFurniturePositions: {'salon_gramophone': [5, 1], 'salon_tele': [8, 1]},
                    backgrounds: {'good': 'living_room_3_good', 'neutral': 'living_room_3_neutral', 'bad': 'living_room_3_bad'}}),
                ]),
                unlockAtLevel: 0,
                links: ['kitchen', 'bathroom', 'bedroom', 'library']},
            
            kitchen: {room: new Room(game, allFurnitures, [
                new Wall(game, allFurnitures, {
                    sizeX: 9, sizeY: 8,
                    correctFurniturePositions: {'cuisine_frigo': [1, 1], 'cuisine_evier': [6, 1], 'cuisine_placard': [1, 5], 'cuisine_cuisiniere': [3, 1]},
                    backgrounds: {'good': 'kitchen_0_good', 'neutral': 'kitchen_0_neutral', 'bad': 'kitchen_0_bad'}}),
                new Wall(game, allFurnitures, {
                    sizeX: 9, sizeY: 8,
                    correctFurniturePositions: {'cuisine_table': [4, 1], 'cuisine_pendule': [5, 5]},
                    doors: [{x: 3, y: 1, onClick: (() => { this.player.move('living_room', 3) }), texture: 'invisible_door', tooltip: 'Entrer'}],
                    backgrounds: {'good': 'kitchen_1_good', 'neutral': 'kitchen_1_neutral', 'bad': 'kitchen_1_bad'}}),
                ]),
                unlockAtLevel: 0,
                links: ['living_room']},

            bathroom: {room: new Room(game, allFurnitures, [
                new Wall(game, allFurnitures, {
                    sizeX: 11, sizeY: 8,
                    correctFurniturePositions: {'sdb_baignoire': [5, 1], 'sdb_miroir': [1, 5], 'sdb_toilettes': [3, 1], 'sdb_lavabo': [1, 1]},
                    doors: [{x: 5.5, y: -3, onClick: (() => { this.player.move('living_room', 2) }), texture: 'arrow_down', tooltip: 'Sortir'}],
                    backgrounds: {'good': 'bathroom_0_good', 'neutral': 'bathroom_0_neutral', 'bad': 'bathroom_0_bad'}}),
                ]),
                unlockAtLevel: 0,
                links: ['living_room']},

            bedroom: {room: new Room(game, allFurnitures, [
                new Wall(game, allFurnitures, {
                    sizeX: 9, sizeY: 8,
                    correctFurniturePositions: {'chambre_miroir': [0, 1], 'chambre_lit': [3, 1], 'chambre_chevet': [7, 1]},
                    backgrounds: {'good': 'bedroom_0_good', 'neutral': 'bedroom_0_neutral', 'bad': 'bedroom_0_bad'}}),
                new Wall(game, allFurnitures, {
                    sizeX: 9, sizeY: 8,
                    correctFurniturePositions: {'chambre_armoire': [5, 1]},
                    backgrounds: {'good': 'bedroom_1_good', 'neutral': 'bedroom_1_neutral', 'bad': 'bedroom_1_bad'}}),
                ]),
                unlockAtLevel: 1,
                links: ['living_room']},

            library: {room: new Room(game, allFurnitures, [
                new Wall(game, allFurnitures, {
                    sizeX: 9, sizeY: 8,
                    correctFurniturePositions: {'bibliotheque_canape': [1, 1], 'bibliotheque_bibliotheque': [4, 1]},
                    backgrounds: {'good': 'library_0_good', 'neutral': 'library_0_neutral', 'bad': 'library_0_bad'}}),
                new Wall(game, allFurnitures, {
                    sizeX: 9, sizeY: 8,
                    correctFurniturePositions: {'bibliotheque_bureau': [0, 1]},
                    backgrounds: {'good': 'library_1_good', 'neutral': 'library_1_neutral', 'bad': 'library_1_bad'}}),
                ]),
                unlockAtLevel: 2,
                links: ['living_room', 'garden']},

            garden: {room: new Room(game, allFurnitures, [
                new Wall(game, allFurnitures, {
                    sizeX: 9, sizeY: 8,
                    correctFurniturePositions: {},
                    backgrounds: {'good': 'garden', 'neutral': 'garden', 'bad': 'garden'}}),
            ]),
                unlockAtLevel: 3,
                links: ['library']}
        }
        this.level = 0
    }

    setPlayer (player) {
        this.player = player
    }

    unlockNewRoom () {
        ++this.level
    }

    checkIfRoomExists (room) {
        if (!this.rooms[room]) {
            throw new Error(`The room ${room} does not exist`)
        }
    }

    availableTransitions (from) {
        this.checkIfRoomExists(from)
        return this.rooms[from].links
        .filter(next_room => this.rooms[next_room].unlockAtLevel <= this.level)
    }

    canTransition (from, to) {
        this.checkIfRoomExists(from)
        this.checkIfRoomExists(to)
        return this.availableTransitions(from).includes(to)        
    }

    getRoom (name) {
        return this.rooms[name].room
    }

    _upgradeLvL1 () {
        console.log('Upgrading to Lvl 1')
        this.level = 1
        this.rooms['living_room'].room.walls[0].doors.push({
            x: 8, y: 1, onClick: (() => { this.player.move('bedroom') }), tooltip: 'Entrer'
        })
        this.rooms['bedroom'].room.walls[1].doors.push({
            x: 2.75, y: 0.95, onClick: (() => { this.player.move('living_room', 2) }), tooltip: 'Entrer'
        })
        this.player._exitWall()
        this.player._enterWall()
    }

    _upgradeLvL2 () {
        console.log('Upgrading to Lvl 2')
        this.level = 2
        this.rooms['living_room'].room.walls[3].doors.push({
            x: 3, y: 1, onClick: (() => { this.player.move('library') }), tooltip: 'Entrer'
        })
        this.rooms['library'].room.walls[1].doors.push({
            x: 7, y: 1, onClick: (() => { this.player.move('living_room', 1) }), tooltip: 'Entrer'
        })
        this.player._exitWall()
        this.player._enterWall()
    }

    _upgradeLvL3 () {
        this.level = 3
        this.rooms['library'].room.walls[0].doors.push({
            x: 8, y: 1, onClick: (() => { this.game.scene.start('GardenScene'); }), texture: 'invisible_door'
        })
        this.player._exitWall()
        this.player._enterWall()
    }

    performMutations () {
        Object.values(this.rooms)
        .map(roomDict => roomDict.room)
        .map(room => room.applyMutations())

        switch (this.level) {
            case 0:
                if (this.rooms['living_room'].room.validated) {
                    this._upgradeLvL1()
                }
            break
            case 1:
                if (this.rooms['bedroom'].room.validated) {
                    this._upgradeLvL2()
                }
            break
            case 2:
                if (this.rooms['library'].room.validated) {
                    this._upgradeLvL3()
                }
            break
        }
    }
}
