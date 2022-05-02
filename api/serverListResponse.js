const ServerListMessage = require("./serverListMessage");
const db = require("./database");
const Servers = require("./servers");

class ServerListResponse{

    constructor(channel){

        this.channel = channel;

        this.timeoutLimit = 800;

        this.created = Date.now();

        this.serverManager = new Servers();

        //	8.6.77.145:7777

        this.servers = [];

        /*this.servers = [
            {"ip": "80.4.151.145", "port": 7777, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "109.230.224.189", "port": 6969, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "80.4.151.145", "port": 5777, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "81.30.148.30", "port": 32800, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "125.63.61.53", "port": 7775, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "1.1.1.1", "port": 7775, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "8.6.77.145", "port": 7777, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "72.249.10.36", "port": 7777, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "104.153.105.8", "port": 7777, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "8.3.6.15", "port": 7777, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "104.153.109.6", "port": 7777, "data": null, "bFinished": false, "listResponse": true},
        ];*/

        this.bSentMessageToDiscord = false;

    }

    async init(){

        try{

            const servers = await this.serverManager.getPingList();

            for(let i = 0; i < servers.length; i++){

                const s = servers[i];

                this.servers.push({
                    "ip": s.ip,
                    "port": s.port,
                    "data": null,
                    "bFinished": false,
                    "bListResponse": true
                });
            }

        }catch(err){
            console.trace(err);
        }

        
    }

    tick(){

        if(this.bFinished) return;

        const diff = Date.now() - this.created;

        if(diff > this.timeoutLimit){

            this.bFinished = true;
            new ServerListMessage(this);
        }

        let totalFinished = 0;

        for(let i = 0; i < this.servers.length; i++){

            const s = this.servers[i];

            if(s.bFinished) totalFinished++;

        }

        console.log(`TOTAL FINISHED IS ${totalFinished}`);

        if(totalFinished === this.servers.length){
            this.bFinished = true;
            new ServerListMessage(this);
        }
    }


}

module.exports = ServerListResponse;