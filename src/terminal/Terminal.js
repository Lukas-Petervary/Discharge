export class Terminal {
    constructor() {
        this.container = document.getElementById('terminal-container');
        this.terminal = this.container.querySelector('.terminal');
        this.header = this.terminal.querySelector('.terminal-header');
        this.output = this.terminal.querySelector('.terminal-output');
        this.inputLine = this.terminal.querySelector('.terminal-input');
        this.prompt = this.inputLine.querySelector('.prompt');
        this.input = this.inputLine.querySelector('#terminal-input');

        this.isOpen = false;
        this.prevCursorLocked = false;

        this.initDrag();
        this.initToggle();
        this.input.addEventListener('keydown', this.handleInput.bind(this));
        this.closeTerminal();
    }

    handleInput(event) {
        if (event.key === 'Enter') {
            const command = this.input.value.trim();
            if (command) {
                this.output.innerHTML += `<div>${this.prompt.textContent}${command}</div>`;
                this.executeCommand(command);
            }
            this.input.value = '';
            this.scrollToBottom();
        }
    }

    executeCommand(command) {
        try {
            const result = eval(command);
            this.outputLog(result);
        } catch (error) {
            this.outputLog(error, true);
        }
    }

    outputLog(message, isError = false) {
        const log = document.createElement('div');
        log.textContent = isError ? `Error: ${message}` : message;
        this.output.appendChild(log);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.output.scrollTop = this.output.scrollHeight;
    }

    log(message) {
        const stack = new Error().stack.split('\n')[2];
        const [file, line] = stack.match(/(?:\/|\\)([^\/\\]+):(\d+):\d+/).slice(1, 3);
        const logMessage = `${file}:${line} - ${message}`;

        window.debugTerminal ? window.debugTerminal.outputLog(logMessage) : console.log(logMessage);
    }

    initDrag() {
        this.header.onmousedown = this.dragMouseDown.bind(this);
    }

    dragMouseDown(event) {
        event.preventDefault();
        this.pos3 = event.clientX;
        this.pos4 = event.clientY;
        document.onmouseup = this.closeDragElement.bind(this);
        document.onmousemove = this.elementDrag.bind(this);
    }

    elementDrag(event) {
        event.preventDefault();
        this.pos1 = this.pos3 - event.clientX;
        this.pos2 = this.pos4 - event.clientY;
        this.pos3 = event.clientX;
        this.pos4 = event.clientY;
        this.terminal.style.top = (this.terminal.offsetTop - this.pos2) + "px";
        this.terminal.style.left = (this.terminal.offsetLeft - this.pos1) + "px";
    }

    closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }

    initToggle() {
        document.addEventListener('keydown', (event) => {
            if (event.key === '`') {
                event.preventDefault();
                this.toggleTerminal();
            }
        });
    }

    toggleTerminal() {
        this.isOpen ? this.closeTerminal() : this.openTerminal();
    }

    openTerminal() {
        this.isOpen = true;
        this.prevCursorLocked = window.cursor.isLocked;
        window.cursor.unlock();
        this.terminal.style.display = 'flex';
        this.input.focus();
    }

    closeTerminal() {
        this.isOpen = false;
        if (this.prevCursorLocked)
            window.cursor.lock();
        this.terminal.style.display = 'none';
    }
}