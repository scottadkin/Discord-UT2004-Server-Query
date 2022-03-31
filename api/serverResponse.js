const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}

class ServerResponse{

    constructor(ip, port, type){

        if(type === "basic"){

            this.requireBasic = true;
            this.requireGame = false;
            this.requirePlayers = false;
        }

        if(type === "game"){

            this.requireBasic = false;
            this.requireGame = true;
            this.requirePlayers = false;
        }

        if(type === "players"){

            this.requireBasic = true;
            this.requireGame = false;
            this.requirePlayers = true;
        }


        this.receivedBasic = false;
        this.receivedGame = false;
        this.receivedPlayers = false;

        this.ip = ip;
        this.port = port;
        this.type = type;
        this.created = Date.now();
        this.lastPacket = Date.now();

        this.initialTimeout = 1000;
        //timeout between multiple packets of the game type
        this.additionTimeout = 100;
        this.bTimedOut = false;

        this.serverInfo = {};
        this.gameInfo = {
            "mutators": []
        };

        this.bFinished = false;
        this.packetsReceived = 0;
        
        console.log("new server response");

        this.events = new MyEmitter();

        //this.startTimer();

    }


    startTimer(){

        if(this.timer !== undefined){
            console.log(`Timer already running`);
            return;
        }

        this.timer = setInterval(() =>{

            console.log(`I received ${this.packetsReceived} packets`);

            const now = Date.now();
            const diff = now - this.lastPacket;
    
            const timeoutLimit = (this.packetsReceived === 0) ? this.initialTimeout : this.additionTimeout;


            if(diff > timeoutLimit){
                clearInterval(this.timer)
            }

            if(diff > this.initialTimeout){

                this.events.emit("timeout");
            }else{
                this.events.emit("finished");
            }

            
   
        }, 100);
    }

    receivedPacket(responseId){

        if(responseId === 0) this.receivedBasic = true;
        if(responseId === 1) this.receivedGame = true;
        if(responseId === 2) this.receivedPlayers = true;

        const now = Date.now();

        this.lastPacket = now;
        this.packetsReceived++;
    }
}

module.exports = ServerResponse;