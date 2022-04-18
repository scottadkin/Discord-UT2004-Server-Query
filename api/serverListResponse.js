class ServerListResponse{

    constructor(){

        console.log("new server list response");

        this.created = Date.now();

        this.servers = [
            {"ip": "80.4.151.145", "port": 7777, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "109.230.224.189", "port": 6969, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "80.4.151.145", "port": 5777, "data": null, "bFinished": false, "listResponse": true},
            {"ip": "81.30.148.30", "port": 32800, "data": null, "bFinished": false, "listResponse": true},
        ];

        this.bSentMessageToDiscord = false;

    }

    tick(){

        if(this.bFinished) return;

        let totalFinished = 0;

        for(let i = 0; i < this.servers.length; i++){

            const s = this.servers[i];

            if(s.bFinished) totalFinished++;

        }

        console.log(`TOTAL FINISHED IS ${totalFinished}`);

        if(totalFinished === this.servers.length){
            this.bFinished = true;
        }
    }


}

module.exports = ServerListResponse;