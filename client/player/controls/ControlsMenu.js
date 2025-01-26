export class ControlsMenu {
    constructor() {
        this.menuElement = document.getElementById('controls-menu-content');
        this.activeKeybind = null;

        window.ControlsMenu_resetKeys = () => {
            delete g_Controls.keybindManager.keybindArray;
            g_Controls.keybindManager.keybindArray = [];
            g_Controls.keybindManager.rebuildMap();

            localStorage.setItem('keybinds', null);
            g_Controls.initializeKeybinds();
            this.renderMenu();
        }
    }

    renderMenu() {
        this.menuElement.innerHTML = '';

        for(const keymapKey in g_Controls) {
            if (g_Controls[keymapKey].keybind === undefined) continue;
            const row = document.createElement('div');
            row.className = 'keybind-row';

            const keybindContainer = document.createElement('div');
            keybindContainer.className = 'keybind-container';

            const label = document.createElement('span');
            label.textContent = keymapKey;
            label.className = 'keybind-label';
            keybindContainer.appendChild(label);

            g_Controls[keymapKey].keybind.keys.forEach((key) => {
                const keyBox = document.createElement('div');
                keyBox.className = 'keybox';
                keyBox.textContent = `'${key}'`;
                keyBox.dataset.key = key;
                keyBox.addEventListener('click', (e) => this.startRebinding(e, keymapKey, keyBox));
                keybindContainer.appendChild(keyBox);
            });

            const addButton = document.createElement('button');
            addButton.textContent = "+ Add Key";
            addButton.addEventListener('click', (e) => this.startAddingKey(e, keymapKey));
            keybindContainer.appendChild(addButton);

            row.appendChild(keybindContainer);
            this.menuElement.appendChild(row);
        }
    }

    handleKeyDown(event) {
        if (this.activeKeybind) {
            const { keymapKey, keyBox } = this.activeKeybind;
            const newKey = event.key === 'Escape' ? null : event.key;
            g_Controls.changeKey(keymapKey, newKey, keyBox.dataset.key);

            this.cleanup();
        } else {
            const addingButton = document.querySelector('.adding');
            if (addingButton) {
                const keybindTag = addingButton.dataset.keybindTag;
                const keybind = g_Controls[keybindTag].keybind;
                if (keybind && !keybind.keys.includes(event.key)) {
                    g_Controls.changeKey(keybindTag, event.key);
                    addingButton.textContent = "+ Add Key";
                    addingButton.classList.remove('adding');
                }
                this.cleanup();
            }
        }
    }

    cleanup() {
        this.activeKeybind = null;
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        this.renderMenu();
    }

    startRebinding(e, keymapKey, keyBox) {
        keyBox.textContent = "[Press Key]";
        keyBox.classList.add('rebinding');
        this.activeKeybind = { keymapKey, keyBox };

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    startAddingKey(e, keymapKey) {
        const addButton = e.currentTarget;
        addButton.textContent = "[Press Key]";
        addButton.classList.add('adding');
        addButton.dataset.keybindTag = keymapKey;

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
}