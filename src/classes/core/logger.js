const winston = require('winston');
const util = require('node:util');
const {combine, timestamp, printf} = winston.format;

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
                printf(({message, timestamp, level, ...meta}) => {
                    const test = Object.getOwnPropertyNames(meta);
                    if (test.includes('metadata')) {

                        let parsedMeta;

                        try {
                            parsedMeta = JSON.stringify(meta['metadata']);
                        } catch (err) {
                            parsedMeta = JSON.stringify(util.inspect(meta['metadata'], {depth: 3}));
                        }
                        return '{' + 'timestamp: \'' + timestamp + '\', level: \'' + level + '\', message: \'' + message + '\', metadata: ' + JSON.parse(parsedMeta) + '}';
                    } else {
                        return '{' + 'timestamp: \'' + timestamp + '\', level: \'' + level + '\', message: \'' + message + '\'}';
                    }
                }),
            ),
            transports: [
                new winston.transports.Console({level: this.lvl})
            ],
        });

    };

    async info(message, meta) {
        if (meta) {
            await this.winstonLogger.log('info', message, {metadata: meta});
        } else {
            await this.winstonLogger.log('info', message, null);
        }
    }

    async error(message, meta) {
        if (meta) {
            await this.winstonLogger.log('error', message, {metadata: meta});
        } else {
            await this.winstonLogger.log('error', message, null);
        }
    }

    async debug(message, meta) {
        if (meta) {
            await this.winstonLogger.log('debug', message, {metadata: meta});
        } else {
            await this.winstonLogger.log('debug', message, null);
        }
    }

}

module.exports = logger;