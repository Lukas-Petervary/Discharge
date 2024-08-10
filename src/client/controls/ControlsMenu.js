export class ControlsMenu {
    constructor() {
        this.menuElement = document.getElementById('controls-menu-content');
        this.activeKeybind = null;
    }

    renderMenu() {
        this.menuElement.innerHTML = '';

        g_KeybindManager.keybindArray.forEach((keybind) => {
            const row = document.createElement('div');
            row.className = 'keybind-row';

            const keybindContainer = document.createElement('div');
            keybindContainer.className = 'keybind-container';

            const label = document.createElement('span');
            label.textContent = Lang.translate(keybind.tag);
            label.className = 'keybind-label';
            keybindContainer.appendChild(label);

            keybind.keys.forEach((key) => {
                const keyBox = document.createElement('div');
                keyBox.className = 'keybox';
                keyBox.textContent = `'${key}'`;
                keyBox.dataset.key = key;  // Store the key value for reference
                keyBox.addEventListener('click', () => this.startRebinding(keybind, keyBox));
                keybindContainer.appendChild(keyBox);
            });

            const addButton = document.createElement('button');
            addButton.textContent = Lang.translate('menu.keybinds.add_key');
            addButton.addEventListener('click', () => this.startAddingKey(keybind));
            keybindContainer.appendChild(addButton);

            row.appendChild(keybindContainer);
            this.menuElement.appendChild(row);
        });
    }

    handleKeyDown(event) {
        if (this.activeKeybind) {
            const { keybind, keyBox } = this.activeKeybind;
            const newKey = event.key === 'Escape' ? null : event.key;
            g_KeybindManager.changeKey(keybind.tag, newKey, keyBox.dataset.key);

            this.cleanup();
        } else {
            const addingButton = document.querySelector('.adding');
            if (addingButton) {
                const keybindTag = addingButton.dataset.keybindTag;
                const keybind = g_KeybindManager.keybindArray.find(kb => kb.tag === keybindTag);
                if (keybind && !keybind.keys.includes(event.key)) {
                    g_KeybindManager.changeKey(keybind.tag, event.key);
                    addingButton.textContent = Lang.translate('menu.keybinds.add_key');
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

    startRebinding(keybind, keyBox) {
        keyBox.textContent = Lang.translate('menu.keybinds.press_key');
        keyBox.classList.add('rebinding');
        this.activeKeybind = { keybind, keyBox };

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    startAddingKey(keybind) {
        const addButton = event.currentTarget;
        addButton.textContent = Lang.translate('menu.keybinds.press_key');
        addButton.classList.add('adding');
        addButton.dataset.keybindTag = keybind.tag;

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
}