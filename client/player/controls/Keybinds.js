import {CameraControls} from "./CameraControls.js";

class KeybindManager {
    constructor() {
        this.keybindArray = [];
        this.keyMap = {};
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    clear() {
        delete this.keybindArray;
        this.keybindArray = [];
        delete this.keyMap;
        this.keyMap = {};
    }

    registerKeybind(keys, caseSensitive) {
        const keybind = {keys: keys, caseSensitive: caseSensitive, isPressed: false, duration: 0};
        this.keybindArray.push(keybind);
        for (const key of keybind.keys) {
            if (!this.keyMap[key])
                this.keyMap[key] = [];
            this.keyMap[key].push(keybind);
        }
        return keybind;
    }

    rebuildMap() {
        delete this.keyMap;
        this.keyMap = {};
        for (const keybind of this.keybindArray) {
            for (const key of keybind.keys) {
                if (!this.keyMap[key])
                    this.keyMap[key] = [];
                this.keyMap[key].push(keybind);
            }
        }
    }

    onKeyDown(e) {
        if (g_Menu.menus['controls-menu'].isDisplayed) return;

        const key = e.key;
        const keybinds = this.keyMap[key];
        if (keybinds) {
            for (const keybind of keybinds) {
                if (!keybind.isPressed) {
                    keybind.isPressed = true;
                } else {
                    keybind.duration = 0;
                }
            }
        }

        if (!key || key === key.toLowerCase()) return;
        const altKeys = this.keyMap[key.toLowerCase()];
        if (altKeys) {
            for (const keybind of altKeys) {
                if (!keybind.isPressed && !keybind.caseSensitive) {
                    keybind.isPressed = true;
                } else {
                    keybind.duration = 0;
                }
            }
        }
    }

    onKeyUp(e) {
        if (g_Menu.menus['controls-menu'].isDisplayed) return;

        const key = e.key;
        const keybinds = this.keyMap[key];
        if (keybinds) {
            for (const keybind of keybinds) {
                if (keybind.isPressed) {
                    keybind.isPressed = false;
                }
            }
        }

        if (!key || key === key.toLowerCase()) return;
        const altKeys = this.keyMap[key.toLowerCase()];
        if (altKeys) {
            for (const keybind of altKeys) {
                if (keybind.isPressed && !keybind.caseSensitive) {
                    keybind.isPressed = false;
                }
            }
        }
    }
}

export const Controls = {
    createKeybind(keys, caseSensitive = false, onPressCallback, onHoldCallback, onReleaseCallback) {
        return {
            keybind: this.keybindManager.registerKeybind(keys, caseSensitive),
            onPress: onPressCallback,
            onHold: onHoldCallback,
            onRelease: onReleaseCallback,
            isPressed() {
                return this.keybind.isPressed;
            }
        };
    },
    changeKey(tag, newKey, oldKey = null) {
        const keybind = this[tag].keybind;
        if (!keybind) throw new Error(`Unknown keybind with tag=${tag}`);
        if (oldKey)
            keybind.keys = keybind.keys.filter(k => k !== oldKey);
        if (newKey && !keybind.keys.includes(newKey))
            keybind.keys.push(newKey);
        this.keybindManager.rebuildMap();
    },
    importSettings(json) {
        try {
            const settings = JSON.parse(json);
            for (const tag in settings) {
                if (this[tag] && this[tag].keybind) {
                    const keybind = this[tag].keybind;
                    keybind.keys = settings[tag];
                }
            }
            this.keybindManager.rebuildMap();
        } catch (e) {
            console.error("Failed to import keybind settings:", e);
        }
    },
    exportSettings() {
        const settings = {};
        for (const key in this) {
            if (this[key].keybind && this[key].keybind.keys) {
                settings[key] = this[key].keybind.keys; // Export tag and keys only
            }
        }
        localStorage.setItem('keybinds', JSON.stringify(settings));
        return JSON.stringify(settings); // Convert settings to JSON for saving
    },
    update() {
        for (const key in this) {
            const kb = this[key];
            if (kb.keybind && kb.keybind.isPressed !== undefined) {
                if (kb.keybind.isPressed) {
                    if (kb.keybind.duration === 0 && kb.onPress) kb.onPress();
                    else if (kb.onHold) kb.onHold();
                    kb.keybind.duration++;
                } else if (kb.keybind.duration !== 0) {
                    if (kb.onRelease) kb.onRelease();
                    kb.keybind.duration = 0;
                }
            }
        }
    },

    keybindManager: new KeybindManager(),
    cameraControls: new CameraControls(),

    initializeKeybinds() {
        this.forward = this.createKeybind(['w']);
        this.backward = this.createKeybind(['s']);
        this.left = this.createKeybind(['a']);
        this.right = this.createKeybind(['d']);
        this.sprint = this.createKeybind(['Shift']);
        this.crouch = this.createKeybind(['c']);
        this.jump = this.createKeybind([' ']);

        this['third person'] = this.createKeybind(['F4'], false, () => g_Client.firstPerson = !g_Client.firstPerson);
        this['lean left'] = this.createKeybind(['q']);
        this['lean right'] = this.createKeybind(['e']);

        this['back menu'] = this.createKeybind(['Escape'], false, () => {
            const duration = g_Menu.currentMenu() === g_Menu.pauseMenu ? 200 : 0
            setTimeout(() => {
                const menusOpen = g_Menu.menuStack.length;
                if (menusOpen > 0) {
                    g_Menu.displayPrevMenu();
                } else if (!g_Controls.cameraControls.isLocked) {
                    g_Menu.showMenu('pause-menu');
                }
            }, duration);
        });

        this.emote1 = this.createKeybind(['1'], false, () => {
            g_Client.playerBody.playAnimation(0);
        });
        this.emote2 = this.createKeybind(['2'], false, () => {
            g_Client.playerBody.playAnimation(0, 0.5);
        });

        const savedKeybinds = localStorage.getItem('keybinds');
        if (savedKeybinds) this.importSettings(savedKeybinds);
    }
};

Controls.initializeKeybinds();