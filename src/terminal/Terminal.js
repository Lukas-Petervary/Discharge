export class Terminal {
    constructor() {
        this.open = false;
        this.terminal = document.getElementById('terminal');
        this.closeBtn = document.getElementById('close-terminal-btn');
        this.terminalOutput = document.getElementById('terminal-output');
        this.isDragging = false;
        this.offset = { x: 0, y: 0 };

        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.closeBtn.addEventListener('click', () => this.closeTerminal());

        this.terminal.querySelector('.terminal-header').addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
    }

    handleKeydown(e) {
        if (e.key === '`') {
            if (this.open) this.closeTerminal();
            else this.openTerminal();
        }
    }

    openTerminal() {
        this.terminal.style.display = 'block';
        this.open = true;
    }

    closeTerminal() {
        this.terminal.style.display = 'none';
        this.open = false;
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
        const { fileName, lineNumber } = this.getCallerInfo();
        this.terminalOutput.textContent += `[${fileName}:${lineNumber}] ${message}\n`;
        this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
    }

    getCallerInfo() {
        const error = new Error();
        const stackLines = error.stack.split('\n');
        const callerLine = stackLines[3].trim();
        const match = callerLine.match(/(\/[^/]+\/[^/]+):(\d+):\d+/);
        if (match) {
            return { fileName: match[1], lineNumber: match[2] };
        }
        return { fileName: 'unknown', lineNumber: 'unknown' };
    }
}