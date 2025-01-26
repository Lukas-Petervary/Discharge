import {ControlsMenu} from "../player/controls/ControlsMenu.js";

export class MenuRegistry {
    constructor() {
        this.menus = {};
        this.menuStack = [];

        this.init();
    }

    init() {
        this.pauseMenu = this.registerMenu(document.getElementById('pause-menu'));
        this.startMenu = this.registerMenu(document.getElementById('start-menu'));
        this.registerMenu(document.getElementById('settings-menu'));
        this.registerMenu(document.getElementById('debug-menu'));

        const controlMenuHandler = new ControlsMenu();
        this.registerMenu(document.getElementById('controls-menu'), () => {controlMenuHandler.renderMenu()});
    }

    registerMenu(menuElement, onDisplay = () => {}) {
        if (!menuElement) {
            throw new Error("Both id and menuElement are required to register a menu.");
        }
        menuElement.isDisplayed = false;
        menuElement.onDisplay = onDisplay;
        this.menus[menuElement.id] = menuElement;

        return menuElement;
    }

    currentMenu() {
        return this.menuStack[this.menuStack.length - 1];
    }

    hideAllMenus() {
        for (const id in this.menus) {
            this.menus[id].classList.remove('active');
            this.menus[id].isDisplayed = false;
        }

        this.menuStack = [];
        g_Controls.cameraControls.enable();
    }

    showMenu(id) {
        const menuElement = this.menus[id];
        if (!menuElement) {
            throw new Error(`No menu found with id: ${id}`);
        }
        if (this.menuStack.length > 0) {
            this.menuStack[this.menuStack.length - 1].classList.remove('active');
        }

        menuElement.classList.add('active');
        menuElement.isDisplayed = true;
        this.menuStack.push(menuElement);
        menuElement.onDisplay();

        g_Controls.cameraControls.disable();
    }

    displayPrevMenu() {
        if (this.menuStack.length === 0) {
            console.error(`No previous menu found`);
            return;
        }
        if (this.currentMenu() === this.startMenu) {
            console.error(`Cannot close start menu`);
            return;
        }

        const currentMenu = this.menuStack.pop();
        currentMenu.classList.remove('active');
        currentMenu.isDisplayed = false;

        if (this.menuStack.length !== 0) {
            const prevMenu = this.menuStack[this.menuStack.length - 1];
            prevMenu.classList.add('active');
        } else {
            g_Controls.cameraControls.enable();
        }
    }
}