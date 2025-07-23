export default class Logger {
    static DEBUG = 1;
    static INFO = 2;
    static WARN = 3;
    static ERROR = 4;
    static CRITICAL = 5;

    static _LEVEL = Logger.DEBUG;

    static setLevel(level) {
        Logger._LEVEL = level;
    }

    static _GET_CALLER() {
        const stack = new Error().stack?.split('\n') || [];
        const callerLine = stack[3] || 'unknown';

        const match = callerLine.match(/([^\/\\\s]+:\d+:\d+)/);
        if (match && match[1])  return match[1];
        else                    return 'unknown';
    }

    static debug(...args) {
        if (Logger._LEVEL <= Logger.DEBUG) {
            console.debug(`%c[DEBUG](${Logger._GET_CALLER()})`, 'color: lime;', ...args);
        }
    }

    static info(...args) {
        if (Logger._LEVEL <= Logger.INFO) {
            console.info(`%c[INFO](${Logger._GET_CALLER()})`, 'color: cyan;', ...args);
        }
    }

    static warn(...args) {
        if (Logger._LEVEL <= Logger.WARN) {
            console.warn(`%c[WARN](${Logger._GET_CALLER()})`, 'color: orange;', ...args);
        }
    }

    static error(...args) {
        if (Logger._LEVEL <= Logger.ERROR) {
            console.error(`%c[ERROR](${Logger._GET_CALLER()})`, 'color: red;', ...args);
        }
    }

    static critical(...args) {
        if (Logger._LEVEL <= Logger.CRITICAL) {
            console.error(`%c[CRITICAL](${Logger._GET_CALLER()})`, 'color: darkred; font-weight: bold; background-color: gray;', ...args);
        }
    }
}
