class Keybind {
    constructor(tag, keys = [], caseSensitive) {
        this.tag = tag;
        this.keys = keys;
        this.caseSensitive = caseSensitive;

        this.press = [];
        this.hold = [];
        this.release = [];
        this.isPressed = false;
    }

    onPress(func) {
        this.press.push(func);
    }

    onHold(func) {
        this.hold.push(func);
    }

    onRelease(func) {
        this.release.push(func);
    }

    executeFunctions(list) {
        for (const lambda of list)
            lambda();
    }

    matchesKey(key) {
        if (this.caseSensitive) {
            return this.keys.includes(key);
        } else {
            return this.keys.some(k => k.toLowerCase() === key.toLowerCase());
        }
    }
}

export class KeybindManager {
    constructor() {
        this.keybindArray = [];
        this.keybinds = {};
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    addKeybind(tag, keys, caseSensitive = true) {
        const keybind = new Keybind(tag, keys, caseSensitive);
        this.keybindArray.push(keybind);
        for (const key of keybind.keys) {
            if (!this.keybinds[key]) {
                this.keybinds[key] = [];
            }
            this.keybinds[key].push(keybind);
        }
        return keybind;
    }

    changeKey(tag, newKey, oldKey) {
        const index = this.keybindArray.findIndex(kb => kb.tag === tag);
        if (index === -1) {
            console.error(`No keybind found with tag: ${tag}`);
            return;
        }
        const keybind = this.keybindArray[index];
        if (oldKey)
            keybind.keys = keybind.keys.filter(k => k !== oldKey);
        if (!keybind.keys.includes(newKey))
            keybind.keys.push(newKey);

        this.rebuildMap();
    }

    rebuildMap() {
        delete this.keybinds;
        this.keybinds = {};
        for (const keybind of this.keybindArray) {
            for (const key of keybind.keys) {
                if (!this.keybinds[key])
                    this.keybinds[key] = [];
                this.keybinds[key].push(keybind);
            }
        }
    }

    onKeyDown(e) {
        const key = e.key;
        const keybinds = this.keybinds[key];
        if (keybinds) {
            for (const keybind of keybinds) {
                if (!keybind.isPressed) {
                    keybind.isPressed = true;
                    keybind.executeFunctions(keybind.press);
                }
            }
        }

        if (key === key.toLowerCase()) return;
        const altKeys = this.keybinds[key.toLowerCase()];
        if (altKeys) {
            for (const keybind of altKeys) {
                if (!keybind.isPressed && !keybind.caseSensitive) {
                    keybind.isPressed = true;
                    keybind.executeFunctions(keybind.press);
                }
            }
        }
    }

    onKeyUp(e) {
        const key = e.key;
        const keybinds = this.keybinds[key];
        if (keybinds) {
            for (const keybind of keybinds) {
                if (keybind.isPressed) {
                    keybind.isPressed = false;
                    keybind.executeFunctions(keybind.release);
                }
            }
        }

        if (key === key.toLowerCase()) return;
        const altKeys = this.keybinds[key.toLowerCase()];
        if (altKeys) {
            for (const keybind of altKeys) {
                if (keybind.isPressed && !keybind.caseSensitive) {
                    keybind.isPressed = false;
                    keybind.executeFunctions(keybind.release);
                }
            }
        }
    }

    update() {
        for (const key in this.keybinds) {
            const keybind = this.keybinds[key];
            if (keybind.isPressed) {
                keybind.executeFunctions(keybind.hold);
            }
        }
    }
}

export class Controls {
    constructor() {
        this.keyboardShift = g_KeybindManager.addKeybind('keyboard.shift', ['Shift']);

        this.moveForward = g_KeybindManager.addKeybind('forward', ['w'], false);
        this.moveBackward = g_KeybindManager.addKeybind('back', ['s'], false);
        this.moveLeft = g_KeybindManager.addKeybind('left', ['a'], false);
        this.moveRight = g_KeybindManager.addKeybind('right', ['d'], false);

        this.sprint = g_KeybindManager.addKeybind('sprint', ['Shift']);
        this.crouch = g_KeybindManager.addKeybind('crouch', ['c'], false)
        this.jump = g_KeybindManager.addKeybind('jump', [' ']);
        this.thirdPerson = g_KeybindManager.addKeybind('thirdPerson', ['F4']);
    }
}