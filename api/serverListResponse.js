const ServerListMessage = require("./serverListMessage");
const db = require("./database");
const Servers = require("./servers");

class ServerListResponse{

    constructor(channel){

        this.channel = channel;
        this.timeoutLimit = 1000;
        this.serverManager = new Servers();
        this.servers = [];
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
                    "bListResponse": true,
                    "displayName": s.name
                });
            }

            this.created = Date.now();

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

        if(totalFinished === this.servers.length){
            this.bFinished = true;
            new ServerListMessage(this);
        }
    }


}

module.exports = ServerListResponse;