/**
 * @fileOverview The very basics of the Pritunl API client: authorization and generic APi call method
 * @author Alexander Kormilin
 * @version 1.2.2
 */

const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const AxiosHeaders = require('axios').AxiosHeaders;

class PritunlBaseClient {
    constructor (props) {
        this.props = props;
        // custom CA for installations with a self-signed certificate; the server hostname is still verified
        this.httpsAgent = undefined;
        if (props.selfSignedCaPath) {
            if (!fs.existsSync(props.selfSignedCaPath)) {
                throw new Error('Pritunl CA certificate file not found: ' + props.selfSignedCaPath);
            }
            this.httpsAgent = new https.Agent({
                ca: [fs.readFileSync(props.selfSignedCaPath)],
                keepAlive: false
            });
        }
        // removing trailing slash
        if (this.props.baseUrl[this.props.baseUrl.length - 1] === "/") {
            this.props.baseUrl = this.props.baseUrl.slice(0, this.props.baseUrl.length - 1);
        }
    }

    /**
     * Performs the authenticated request to Pritunl API server
     * @param {object} options - The request options
     */
    async makeRequest(options){
        const {apiToken, apiSecret, baseUrl} = this.props;
        const defaultOptions = {
            apiToken,
            apiSecret,
            baseUrl,
        };
        options = Object.assign({}, defaultOptions, options);
        const authNonce = crypto.randomBytes(16).toString('hex');
        const authTimeStamp = Math.floor(Date.now() / 1000);
        const authString = [options.apiToken, authTimeStamp, authNonce, options.method.toUpperCase(), options.path].join("&");
        const authHeadersObj = {
            "Auth-Token": options.apiToken,
            "Auth-Timestamp": authTimeStamp,
            "Auth-Nonce": authNonce,
            "Auth-Signature": crypto.createHmac("sha256", options.apiSecret).update(authString).digest("base64")
        };
        const headers = new AxiosHeaders(authHeadersObj);
        const url = `${baseUrl}${options.path}`;
        let result;
        try {
            result = await axios({
                method: options.method,
                url,
                headers: headers,
                httpsAgent: this.httpsAgent,
                data: options.data ? options.data : null,
            });
            // logging the status only: the full response and error objects carry the request headers, Auth-Token included
            await this.props.loggerInstance.debug('Pritunl API query OK (' + options.method + ' ' + url + '): HTTP ' +
                result.status);
            return result;
        } catch (err) {
            await this.props.loggerInstance.error('Pritunl API query failure (' + options.method + ' ' + url + '): ' +
                (err.response ? 'HTTP ' + err.response.status : err.message));
            throw err;
        }
    }
}

module.exports = PritunlBaseClient;