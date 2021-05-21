import {Chalk} from "chalk";

const chalk: Chalk = require('chalk');

// The width of the title for each log
const PROMPT_WIDTH: number = parseInt(process.env.PROMPT_WIDTH ?? "15");
// Whether or not to print debug messages
const DEBUG: boolean = parseInt(process.env.DEBUG ?? '0') > 0;

/**
 *  Adds padding to either side of the
 *  provided text until it reaches the
 *  required width (centers the text)
 *
 *  @param {string} text The text to give padding
 *  @param {number} width The width to pad until
 *  @return
 */
function padToWidth(text: string, width: number): string {
    // Get the difference in length between the width and text
    const diff: number = Math.floor((width - text.length) / 2);
    // Apply the padding to both sides
    text = ' '.repeat(diff) + text + ' '.repeat(diff);
    if (text.length < width) {
        text += ' '.repeat(width - text.length);
    }
    return text;
}

/**
 *  Logs out the message provided converting
 *  the text to a string if it is not
 *
 *  @param {string} title The title of the log
 *  @param _text The body message
 *  @param {string} suffix An optional suffix to append to the end
 *  @param {boolean} error If this should be printed to the error stream
 */
function log(title: string, _text: string | any, suffix: string = '', error: boolean = false): void {
    let text: string = title + ' » ';
    if (typeof _text === 'string') { // If the text is a string
        text += chalk.gray(_text); // The text stays the same
    } else { // If the text is not a string
        text += chalk.yellow(JSON.stringify(_text)); // Stringify the object
    }
    // Append the suffix and shade it in dark
    text += ' ' + chalk.hex('#222222')(suffix);
    if (!error) {
        console.log(text);
    } else {
        console.error(text);
    }
}

/**
 *  Logs out an error message with a red title
 *
 *  @param {string} title The title of the log
 *  @param text The body message
 *  @param {string} suffix An optional suffix to append to the end
 */
export function error(title: string, text: string | any, suffix: string = '') {
    log(chalk.bgRed.black(padToWidth(title, 15)), text, suffix, true);
}

/**
 *  Logs out an good message with a green title
 *
 *  @param {string} title The title of the log
 *  @param text The body message
 *  @param {string} suffix An optional suffix to append to the end
 */
export function good(title: string, text: string | any, suffix: string = '') {
    log(chalk.bgGreen.black(padToWidth(title, PROMPT_WIDTH)), text, suffix)
}

/**
 *  Logs out an okay message with a yellow title
 *
 *  @param {string} title The title of the log
 *  @param text The body message
 *  @param {string} suffix An optional suffix to append to the end
 */
export function okay(title: string, text: string | any, suffix: string = '') {
    log(chalk.bgYellow.black(padToWidth(title, PROMPT_WIDTH)), text, suffix);
}

/**
 *  Logs out an info message with a gray title
 *
 *  @param {string} title The title of the log
 *  @param text The body message
 *  @param {string} suffix An optional suffix to append to the end
 */
export function info(title: string, text: string | any, suffix: string = '') {
    log(chalk.bgGray.black(padToWidth(title, PROMPT_WIDTH)), text, suffix);
}

/**
 *  Logs a debug message which will only show when
 *  debug is enabled
 *
 *  @param text The body message
 *  @param {string} suffix An optional suffix to append to the end
 */
export function debug(text: string | any, suffix: string = '') {
    if (!DEBUG) return;
    log(chalk.bgBlue.black(padToWidth('DEBUG', PROMPT_WIDTH)), text, suffix);
}