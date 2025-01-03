const winston = require('winston');
const { combine, timestamp, printf, colorize } = winston.format;

class logger {
    constructor({
        logLvl
    }) {
        const allowedLevels = ['info', 'error', 'debug'];
        if (allowedLevels.includes(logLvl) === false) {
            throw new Error('Logging level must be one of the following: info, error or debug, but ' + logLvl + ' has been passed');
        }
        this.lvl = logLvl;
        this.winstonLogger = winston.createLogger({
            level: this.lvl,
            format: combine(
                timestamp(),
                printf(({ level, message, timestamp, ...meta }) => '[' + timestamp + '] ' + level + ': ' + message + ' ' + (meta ? JSON.stringify(meta) : '')),
            ),
            transports: [
                new winston.transports.Console({level: this.lvl})
            ],
        });

    };

    async info(message, meta) {
        await this.winstonLogger.log('info', message, meta);
    }

    async error(message, meta) {
        await this.winstonLogger.log('error', message, meta);
    }

    async debug(message, meta) {
        await this.winstonLogger.log('debug', message, meta);
    }

}

module.exports = logger;