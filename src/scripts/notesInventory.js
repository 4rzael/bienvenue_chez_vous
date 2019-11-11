const VIEW_WIDTH = 1920;
const VIEW_HEIGHT = 1080;

const NOTES_AMMOUNT = 8;
const OFFSET_INV_Y = 43;
const OFFSET_INV_X = 83;
const INV_WIDTH = 900;
const INV_HEIGHT = 97;
const INV_X = OFFSET_INV_X + (INV_WIDTH / 2);
const INV_Y = OFFSET_INV_Y + (INV_HEIGHT / 2);

const NOTES_INV_PADDING_X = 42;
const NOTES_OFFSET_X = NOTES_INV_PADDING_X + OFFSET_INV_X;
const NOTES_OFFSET_Y = 25 + OFFSET_INV_Y;
const NOTES_SPACING = 23;
const NOTE_SIZE = 45;

const OVERLAY_DEPTH = 1000;

export default class NotesInventory {
    noteLevel;
    noteSprites;
    game;
    overlay;
    detailedNoteSprite;
    unFocus;
    isBookUnlocked;
    stackedDetails;

    constructor(_game) {
        this.game = _game;
        this.noteLevel = 0;
        this.noteSprites = [];
        this.stackedDetails = [];
        this.detailedNoteSprite = undefined;
        this.isBookUnlocked = false;
        this.halfDispenser = 0

        /* Debug rect
        this.game.add.rectangle(INV_X, INV_Y,
            INV_WIDTH, INV_HEIGHT, 0xdadada);
            */
        
        this.overlay = this.game.add.rectangle(0, 0,
            VIEW_WIDTH, VIEW_HEIGHT, 0, 0.7
        );
        this.overlay.setDisplayOrigin(0, 0);
        this.overlay.setDepth(OVERLAY_DEPTH);
        this.overlay.setInteractive();
        let that = this;
        this.overlay.setVisible(false);
        this.unFocus = () => {
            if (that.detailedNoteSprite !== undefined) {
                that.detailedNoteSprite.destroy();

                let upNext = that.stackedDetails.shift();
                if (upNext !== undefined) {
                    upNext.setVisible(true);
                    that.detailedNoteSprite = upNext;
                } else {
                    that.overlay.setVisible(false);
                    that.detailedNoteSprite = undefined;
                }
            }
        };
        this.overlay.on('pointerdown', this.unFocus);

        for (let i = 0; i < NOTES_AMMOUNT; i++) {
            this.game.load.image(`note_${i}_icon`, `assets/img/sprites/notes/papier_icone_${i + 1}.png`);
            this.game.load.image(`note_${i}_details`, `assets/img/sprites/notes/details_${i}.png`);
        }

        this.game.load.image('book_icon', 'assets/img/sprites/notes/icone_livreok.png');
        this.game.load.image('book_details', 'assets/img/sprites/notes/livre_demon.png');

    }

    halfDispense () {
        ++this.halfDispenser
        if (this.halfDispenser % 2) {
            try {
                this.unlockNote()
            } catch {}
        }
    }

    notesAvailable () {
        return 8 - this.noteLevel
    }

    unlockNote() {
        if (this.noteLevel + 1 > NOTES_AMMOUNT) {
            console.error('Trying to unlock more notes than possible');
            return;
        }
        let noteSprite = this.game.add.sprite(
            NOTES_OFFSET_X + (this.noteLevel * (NOTE_SIZE + NOTES_SPACING)), NOTES_OFFSET_Y,
            `note_${this.noteLevel}_icon`
        );
        noteSprite.setDisplayOrigin(0, 0);
        noteSprite.setInteractive();
        let note = this.noteLevel;
        noteSprite.on('pointerdown', pointer => {
            this.enlargeNote(note);
        });

        this.noteSprites.push(noteSprite);
        this.enlargeNote(this.noteLevel)
        this.noteLevel++;
    }

    enlargeNote(chosen) {
        if (this.detailedNoteSprite !== undefined) {
            this.detailedNoteSprite.setVisible(false);
            this.stackedDetails.push(this.detailedNoteSprite);
        } else {
            this.overlay.setVisible(true);
        }

        this.detailedNoteSprite = this.game.add.sprite(
            VIEW_WIDTH / 2, VIEW_HEIGHT / 2,
            `note_${chosen}_details`
        );
        this.detailedNoteSprite.setDepth(OVERLAY_DEPTH + 1);
        this.detailedNoteSprite.setInteractive();
        this.detailedNoteSprite.on('pointerdown', this.unFocus);
    }

    openBook(that) {
        return () => {
            if (that.detailedNoteSprite !== undefined) {
                that.detailedNoteSprite.setVisible(false);
                that.stackedDetails.push(that.detailedNoteSprite);
            } else {
                that.overlay.setVisible(true);
            }
            that.detailedNoteSprite = that.game.add.sprite(
                VIEW_WIDTH / 2, VIEW_HEIGHT / 2,
                'book_details'
            );
            that.detailedNoteSprite.setDepth(OVERLAY_DEPTH + 1);
            that.detailedNoteSprite.setInteractive();
            that.detailedNoteSprite.on('pointerdown', that.unFocus);
        };
    }

    unlockBook() {
        if (this.isBookUnlocked) {
            return;
        }
        let bookSprite = this.game.add.sprite(
            NOTES_OFFSET_X + INV_WIDTH - NOTE_SIZE - (NOTES_INV_PADDING_X * 2),
            NOTES_OFFSET_Y,
            'book_icon'
        );
        bookSprite.setDisplayOrigin(0, 0);
        bookSprite.setInteractive();
        bookSprite.on('pointerdown', this.openBook(this));
        this.noteSprites.push(bookSprite);
        this.isBookUnlocked = true;
        this.openBook(this)()
    }

}