export class Terminal {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.openBtn = document.getElementById('open-terminal-btn');
        this.closeBtn = document.getElementById('close-terminal-btn');
        this.terminalOutput = document.getElementById('terminal-output');
        this.isDragging = false;
        this.offset = { x: 0, y: 0 };

        this.init();
    }

    init() {
        this.openBtn.addEventListener('click', () => this.openTerminal());
        this.closeBtn.addEventListener('click', () => this.closeTerminal());

        this.terminal.querySelector('.terminal-header').addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
    }

    openTerminal() {
        this.terminal.style.display = 'block';
    }

    closeTerminal() {
        this.terminal.style.display = 'none';
    }

    startDrag(e) {
        this.isDragging = true;
        this.offset = {
            x: e.clientX - this.terminal.getBoundingClientRect().left,
            y: e.clientY - this.terminal.getBoundingClientRect().top
        };
    }

    drag(e) {
        if (this.isDragging) {
            this.terminal.style.left = `${e.clientX - this.offset.x}px`;
            this.terminal.style.top = `${e.clientY - this.offset.y}px`;
        }
    }

    stopDrag() {
        this.isDragging = false;
    }

    log(message) {
        this.terminalOutput.textContent += `${message}\n`;
        this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.debugTerminal = new DebugTerminal();
});