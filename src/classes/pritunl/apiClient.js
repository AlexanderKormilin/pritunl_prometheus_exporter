/**
 * @fileOverview The high-lvl API client for Pritunl
 * @author Alexander Kormilin
 * @version 1.2.2
 */

const PritunlBaseClient = require('./base');

class Pritunl extends PritunlBaseClient {
    constructor({
        baseUrl,
        apiToken,
        apiSecret,
        selfSignedCaPath,
        loggerInstance
    }){
        if (!apiSecret || apiSecret === '') {
            throw new Error('Pritunl API secret may not be undefined or empty');
        } else if (!apiToken) {
            throw new Error('Pritunl API token may not be undefined or empty');
        } else if (!baseUrl) {
            throw new Error('Pritunl installation base URL may not be undefined or empty');
        } else if (!loggerInstance) {
            throw new Error('Logger instance may not be undefined or empty');
        }
        super({
            baseUrl: baseUrl,
            apiToken: apiToken,
            apiSecret: apiSecret,
            selfSignedCaPath: selfSignedCaPath,
            loggerInstance: loggerInstance
        });
    }

    /**
     * Gets the complete list of all links existing on the Pritunl server
     */
    async listLinks(){
        try{
            const res = await super.makeRequest({
                method: "GET",
                path: "/link"
            });
            return res.data;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Gets the locations of the link with ID provided
     * @param {string} linkId - The internal ID of the target link
     */
    async listLinkLocations(linkId){
        try{
            const res = await super.makeRequest({
                method: "GET",
                path: "/link/" + linkId + "/location"
            });
            return res.data;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Gets the complete list of all servers existing on the Pritunl server
     */
    async listServers(){
        try{
            const res = await super.makeRequest({
                method: "GET",
                path: "/server"
            });
            return res.data;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Gets the complete list of all hosts existing on the Pritunl server
     */
    async listHosts(){
        try{
            const res = await super.makeRequest({
                method: "GET",
                path: "/host"
            });
            return res.data;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Gets the CPU and RAM usage data for the host with ID provided
     * @param {string} hostId - The internal ID of the target host
     */
    async getHostUsageData(hostId){
        try{
            const res = await super.makeRequest({
                method: "GET",
                path: "/host/" + hostId + "/usage/1m"
            });

            return {
                cpu: res.data.cpu[res.data.cpu.length - 1][1],
                mem: res.data.mem[res.data.mem.length - 1][1]
            };
        } catch (err) {
            throw err;
        }
    }

    /**
     * Gets the bandwidth usage data for the server with ID provided
     * @param {string} serverId - The internal ID of the target server
     */
    async getServerBandwidthData(serverId){
        try{
            const res = await super.makeRequest({
                method: "GET",
                path: "/server/" + serverId + "/bandwidth/1m"
            });

            return {
                sent: res.data.sent[res.data.sent.length - 1][1],
                received: res.data.received[res.data.received.length - 1][1]
            };
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Pritunl;