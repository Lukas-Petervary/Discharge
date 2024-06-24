export class Terminal {
    constructor() {
        this.open = false;
        this.terminal = document.getElementById('terminal');
        this.closeBtn = document.getElementById('close-terminal-btn');
        this.terminalInput = document.getElementById('terminal-input');
        this.terminalOutput = document.getElementById('terminal-output');
        this.isDragging = false;
        this.offset = { x: 0, y: 0 };
        this.cursorPrevLocked = false;

        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.closeBtn.addEventListener('click', () => this.closeTerminal());
        this.terminalInput.addEventListener('keydown', (e) => this.handleInput(e));

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

    handleInput(e) {
        if (e.key === 'Enter') {
            const code = this.terminalInput.value;
            this.terminalInput.value = '';

            try {
                eval(code);
                this.log(`> ${code}`);
            } catch (err) {
                this.log(`> ${code}\nError: ${err.message}`);
            }
        }
    }


    openTerminal() {
        this.terminal.style.display = 'block';
        this.open = true;
        this.cursorPrevLocked = window.cursor.isLocked;
        window.cursor.unlockCursor();
    }

    closeTerminal() {
        this.terminal.style.display = 'none';
        this.open = false;
        if (this.cursorPrevLocked) {
            window.cursor.lockCursor();
        }
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