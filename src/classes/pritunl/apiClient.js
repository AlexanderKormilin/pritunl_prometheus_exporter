const PritunlApiAuthentication = require('./authentication');

class Pritunl extends PritunlApiAuthentication {
    constructor({
       baseUrl,
       apiToken,
       apiSecret,
       selfSignedCaPath
    }){
        super({
            baseUrl: baseUrl,
            apiToken: apiToken,
            apiSecret: apiSecret,
            selfSignedCaPath: selfSignedCaPath
        });
    }

    async listLinks(){
        try{
            const res = await super.makeAuthorizedRequest({
                method: "GET",
                path: "/link"
            });
            return res.data;
        } catch(err){
            console.log(err);
        }
    }

    async listLinkLocations(linkId){
        try{
            const res = await super.makeAuthorizedRequest({
                method: "GET",
                path: "/link/" + linkId + "/location"
            });
            return res.data;
        } catch(err){
            console.log(err);
        }
    }

    async listServers(){
        try{
            const res = await super.makeAuthorizedRequest({
                method: "GET",
                path: "/server"
            });
            return res.data;
        } catch(err){
            console.log(err);
        }
    }

    async listHosts(){
        try{
            const res = await super.makeAuthorizedRequest({
                method: "GET",
                path: "/host"
            });
            return res.data;
        } catch(err){
            console.log(err);
        }
    }

    async getHostUsageData(hostId){
        try{
            const res = await super.makeAuthorizedRequest({
                method: "GET",
                path: "/host/" + hostId + "/usage/1m"
            });
            return res.data;
        } catch(err){
            console.log(err);
        }
    }

    async getServerBandwidthData(serverId){
        try{
            const res = await super.makeAuthorizedRequest({
                method: "GET",
                path: "/server/" + serverId + "/bandwidth/1m"
            });

            return {
                sent: res.data.sent[res.data.sent.length - 1][1],
                received: res.data.received[res.data.received.length - 1][1]
            };
        } catch(err){
            console.log(err);
        }
    }
}

module.exports = Pritunl;