/**
 * @fileOverview The very basics of the Pritunl API client: authorization and generic APi call method
 * @author Alexander Kormilin
 * @version 1.2.1
 */

const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const AxiosHeaders = require('axios').AxiosHeaders;

class PritunlBaseClient {
    constructor (props) {
        this.props = props;
        if (props.selfSignedCaPath && fs.existsSync(props.selfSignedCaPath)) {
            axios.defaults.httpsAgent = new https.Agent({
                ca: [fs.readFileSync(props.selfSignedCaPath)],
                checkServerIdentity: () => {
                    return null;
                },
                keepAlive: false
            });
        }
        if (this.props.baseUrl[this.props.baseUrl.length - 1] === "/") {
            this.props.baseUrl = this.props.baseUrl.slice(0, this.props.baseUrl.length - 1);
        }
        this.loggerInstance = this.props.loggerInstance;
    }

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
                data: options.data ? options.data : null,
            });
            await this.loggerInstance.debug('Pritunl API query OK (' + options.method + ' ' + url + ')', result);
            return result;
        } catch (err) {
            await this.loggerInstance.error('Pritunl API query failure (' + options.method + ' ' + url + ')', err);
            throw err;
        }
    }
}

module.exports = PritunlBaseClient;