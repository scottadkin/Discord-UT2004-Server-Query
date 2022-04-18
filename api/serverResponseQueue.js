const ServerResponse = require("./serverResponse");
const ServerListResponse = require("./serverListResponse");

class ServerResponseQueue{

    constructor(){

        this.responses = [];

        this.startInterval();
    }

    create(ip, port, type, messageChannel){

        const response = new ServerResponse(ip, port, type, messageChannel);
        this.responses.push(response);

        return response;
    }

    createList(messageChannel){

        const response = new ServerListResponse(messageChannel);
        this.responses.push(response);

        return response;
    }

    getResponse(ip, port, type){

        console.log(`${ip}:${port}`);

        for(let i = 0; i < this.responses.length; i++){

            const r = this.responses[i];

            if(r.servers === undefined){

                if(r.ip === ip && r.port === port){
                    return r;
                }

            }else{

                console.log("SERVER LIST RESPONSE");
                //for server list responses
                for(let x = 0; x < r.servers.length; x++){

                    if(r.servers[x].ip === ip && r.servers[x].port === port - 1){
                        console.log(`RESPONSE INDEX IS ${x}`);
                        return r.servers[x];
                    }
                }
            }
        }

        return null;
    }

    deleteCompletedResponses(){

        if(this.responses.length === 0) return;

        //console.log("DLETE COMPLETE RESPONSE");

        const indexesToDelete = [];

        for(let i = 0; i < this.responses.length; i++){

            const r = this.responses[i];

            if(r.bSentMessageToDiscord){
                indexesToDelete.push(i);
            }

        }
   
        //console.log(indexesToDelete);

        if(indexesToDelete.length > 0){

            let deleted = 0;

            for(let i = 0; i < indexesToDelete.length; i++){

                this.responses.splice(indexesToDelete[i] - deleted, 1);
                deleted++;
            }
        }

    }

    responseTick(){

        //console.log(this.responses.length);

        if(this.responses.length === 0) return;

        for(let i = 0; i < this.responses.length; i++){

            const r = this.responses[i];

            //console.log("tick");

            r.tick();

        }
    }

    startInterval(){

        this.interval = setInterval(() =>{
            //console.log("tick");
            //console.log(this.responses.length);
            this.responseTick();
            this.deleteCompletedResponses();
        }, 50);
    }

}

module.exports = ServerResponseQueue;