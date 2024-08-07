export class MenuRegistry {
    constructor() {
        this.menus = {};
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        this.registerMenu('pause-menu', document.getElementById('pause-menu'));
        this.registerMenu('start-menu', document.getElementById('start-menu'));
    }

    registerMenu(id, menuElement) {
        if (!id || !menuElement) {
            throw new Error("Both id and menuElement are required to register a menu.");
        }
        this.menus[id] = menuElement;
    }

    toggleMenu(id) {
        if (!this.menus[id]) {
            throw new Error(`No menu found with id: ${id}`);
        }
        const menuElement = this.menus[id];
        if (menuElement.style.display === 'block') {
            menuElement.style.display = 'none';
            this.isMenuOpen = false;
        } else {
            this.hideAllMenus();
            menuElement.style.display = 'block';
            this.isMenuOpen = true;
        }
        this.updateCursorVisibility();
    }

    hideAllMenus() {
        for (const id in this.menus) {
            this.menus[id].style.display = 'none';
        }
        this.isMenuOpen = false;
        this.updateCursorVisibility();
    }

    showMenu(id) {
        if (!this.menus[id]) {
            throw new Error(`No menu found with id: ${id}`);
        }
        this.hideAllMenus();
        this.menus[id].style.display = 'block';
        this.isMenuOpen = true;
        this.updateCursorVisibility();
    }

    hideMenu(id) {
        if (!this.menus[id]) {
            throw new Error(`No menu found with id: ${id}`);
        }
        this.menus[id].style.display = 'none';
        this.isMenuOpen = false;
        this.updateCursorVisibility();
    }

    updateCursorVisibility() {
        if (this.isMenuOpen) {
            document.body.style.cursor = 'default'; // Show the client cursor
        } else {
            document.body.style.cursor = 'none'; // Hide the client cursor
        }
    }
}