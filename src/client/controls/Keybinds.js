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

    containsFunc(func, list) {
        return list.includes(func);
    }

    onPress(func) {
        if (!this.containsFunc(func, this.press)) this.press.push(func);
    }

    onHold(func) {
        if (!this.containsFunc(func, this.hold)) this.hold.push(func);
    }

    onRelease(func) {
        if (!this.containsFunc(func, this.release)) this.release.push(func);
    }

    executeFunctions(list) {
        for (const lambda of list)
            lambda();
    }

    toJSON() {
        return {
            tag: this.tag,
            keys: this.keys,
            caseSensitive: this.caseSensitive,
            press: this.press.map(func => func.toString()),
            hold: this.hold.map(func => func.toString()),
            release: this.release.map(func => func.toString())
        };
    }

    static fromJSON(data) {
        const keybind = new Keybind(data.tag, data.keys, data.caseSensitive);
        keybind.press = data.press.map(str => new Function('return ' + str)()); // Convert string back to function
        keybind.hold = data.hold.map(str => new Function('return ' + str)());
        keybind.release = data.release.map(str => new Function('return ' + str)());
        return keybind;
    }
}

export class KeybindManager {
    constructor() {
        this.keybindArray = [];
        this.keybinds = {};
        this.keysPressed = [];
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    registerKeybind(tag, keys, caseSensitive = true) {
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

    changeKey(tag, newKey, oldKey = null) {
        const index = this.keybindArray.findIndex(kb => kb.tag === tag);
        if (index === -1) {
            console.error(`No keybind found with tag: ${tag}`);
            return;
        }
        const keybind = this.keybindArray[index];
        if (oldKey)
            keybind.keys = keybind.keys.filter(k => k !== oldKey);
        if (newKey && !keybind.keys.includes(newKey))
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
        const keybindsJSON = localStorage.getItem('keybinds');
        if (!keybindsJSON) {
            this.defaultKeybinds();
            this.saveKeybinds();
            return;
        }
        this.loadKeybinds(keybindsJSON);
    }

    saveKeybinds() {
        const uniqueKeybindsMap = new Map();
        for (const keybind of g_KeybindManager.keybindArray) {
            uniqueKeybindsMap.set(keybind.tag, keybind.toJSON());
        }
        const uniqueKeybindsData = Array.from(uniqueKeybindsMap.values());
        localStorage.setItem('keybinds', JSON.stringify(uniqueKeybindsData));
    }

    loadKeybinds() {
        const keybindsJSON = localStorage.getItem('keybinds');
        if (keybindsJSON) {
            const keybindsData = JSON.parse(keybindsJSON);
            g_KeybindManager.keybindArray = keybindsData.map(data => Keybind.fromJSON(data));
            g_KeybindManager.rebuildMap();
        }
    }

    of(tag) {
        const kb = g_KeybindManager.keybindArray.find(k => k.tag === tag);
        if (kb) return kb;
        throw new Error(`Keybind of ID "${tag}" not found.`);
    }

    defaultKeybinds() {
        g_KeybindManager.registerKeybind('key.movement.forward', ['w'], false);
        g_KeybindManager.registerKeybind('key.movement.backward', ['s'], false);
        g_KeybindManager.registerKeybind('key.movement.left', ['a'], false);
        g_KeybindManager.registerKeybind('key.movement.right', ['d'], false);

        g_KeybindManager.registerKeybind('key.movement.sprint', ['Shift']);
        g_KeybindManager.registerKeybind('key.movement.crouch', ['c'], false)
        g_KeybindManager.registerKeybind('key.movement.jump', [' ']);

        g_KeybindManager.registerKeybind('key.camera.third_person', ['F4']);
    }
}