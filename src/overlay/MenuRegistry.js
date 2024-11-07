import {ControlsMenu} from "../client/controls/ControlsMenu.js";

export class MenuRegistry {
    constructor() {
        this.menus = {};
        this.menuStack = [];
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        this.registerMenu(document.getElementById('pause-menu'));
        this.registerMenu(document.getElementById('start-menu'));
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
    }

    hideAllMenus() {
        for (const id in this.menus) {
            this.menus[id].classList.remove('active');
            this.menus[id].isDisplayed = false;
        }

        this.isMenuOpen = false;
        this.menuStack = [];
        this.updateCursorVisibility();
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
        this.isMenuOpen = true;
        this.menuStack.push(menuElement);
        menuElement.onDisplay();

        this.updateCursorVisibility();
    }

    hideMenu(id) {
        const menuElement = this.menus[id];
        if (!menuElement) {
            throw new Error(`No menu found with id: ${id}`);
        }

        menuElement.isDisplayed = false;
        menuElement.classList.remove('active');
        this.isMenuOpen = false;
        this.menuStack = this.menuStack.filter(menu => menu.id !== id);

        this.updateCursorVisibility();
    }

    updateCursorVisibility() {
        if (this.isMenuOpen) {
            document.body.style.cursor = 'default';
            g_Cursor.unlock();
        } else {
            document.body.style.cursor = 'none';
            g_Cursor.lock();
        }
    }

    displayPrevMenu() {
        if (this.menuStack.length === 0) {
            console.error(`No previous menu found`);
            return;
        }
        if (this.menuStack.length === 1) {
            console.warn(`Must interact with menu to resume game`);
            return;
        }

        const currentMenu = this.menuStack.pop();
        currentMenu.classList.remove('active');
        currentMenu.isDisplayed = false;

        const prevMenu = this.menuStack[this.menuStack.length - 1];
        prevMenu.classList.add('active');
        this.isMenuOpen = true;

        this.updateCursorVisibility();
    }
}