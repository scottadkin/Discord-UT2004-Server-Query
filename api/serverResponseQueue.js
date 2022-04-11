const ServerResponse = require("./serverResponse");

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

    getResponse(ip, port, type){

        console.log(`${ip}:${port}`);

        for(let i = 0; i < this.responses.length; i++){

            const r = this.responses[i];
            console.log(`${r.ip}:${r.port}`);
            if(r.ip === ip && r.port === port){
                return r;
            }
        }

        return null;
    }

    deleteCompletedResponses(){

        if(this.responses.length === 0) return;

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

        if(this.responses.length === 0) return;

        for(let i = 0; i < this.responses.length; i++){

            const r = this.responses[i];

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