const ServerListMessage = require("./serverListMessage");

class ServerListResponse{

    constructor(channel){

        this.channel = channel;
        console.log("new server list response");

        this.timeoutLimit = 800;

        this.created = Date.now();

        //125.63.61.53:7775

        this.servers = [
            {"ip": "80.4.151.145", "port": 7777, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "109.230.224.189", "port": 6969, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "80.4.151.145", "port": 5777, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "81.30.148.30", "port": 32800, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "125.63.61.53", "port": 7775, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "1.1.1.1", "port": 7775, "data": null, "bFinished": false, "listResponse": true},
        ];

        this.bSentMessageToDiscord = false;

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