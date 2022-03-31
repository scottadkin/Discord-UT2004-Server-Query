const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}

class ServerResponse{

    constructor(ip, port, type){

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
        
        console.log(this);

        console.log("new server response");

        this.events = new MyEmitter();

    }


    receivedPacket(){

        const now = Date.now();

        const diff = now - this.lastPacket;
        
        if(diff > (this.packetsReceived === 0) ? this.initialTimeout : this.additionTimeout){

            if(this.packetsReceived === 0){

                this.events.emit("timeout");
                this.bTimedOut = true;
            }else{
                this.bFinished = true;
                this.events.emit("finished");
            }    
        }

        this.lastPacket = now;
    }
}

module.exports = ServerResponse;