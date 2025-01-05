const PritunlBaseClient = require('./pritunl');

class Pritunl extends PritunlBaseClient {
    constructor({
        baseUrl,
        apiToken,
        apiSecret,
        selfSignedCaPath,
        loggerInstance
    }){
        super({
            baseUrl: baseUrl,
            apiToken: apiToken,
            apiSecret: apiSecret,
            selfSignedCaPath: selfSignedCaPath,
            loggerInstance: loggerInstance
        });
    }

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