const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const serverQueryMessage = require("./serverQueryMessage");

class ServerResponse{

    constructor(ip, port, type, messageChannel){

        this.bSinglePacketOnly = (type === "basic") ? true : false;

        this.receivedBasic = false;
        this.receivedGame = false;
        this.receivedPlayers = false;
        this.messageChannel = messageChannel;

        this.ip = ip;
        this.port = port;
        this.type = type;
        this.timeAlive = 0;

        this.initialTimeout = 1000;
        //timeout between multiple packets of the game type
        this.additionTimeout = 100;
        
        this.created = Date.now();
        this.lastPacket = Date.now();

        this.serverInfo = {};
        this.gameInfo = {
            "mutators": []
        };

        this.bFinished = false;
        this.packetsReceived = 0;

        this.players = [];

        this.events = new MyEmitter();


        this.bCanTick = false;

        this.bSentMessageToDiscord = false;

        //this.startTimer();

    }


    enableTick(){
        this.bCanTick = true;
    }


    tick(){

        if(!this.bCanTick) return;

        if(this.bFinished) return;


        console.log(`I received ${this.packetsReceived} packets`);

        const now = Date.now();
        const diff = now - this.lastPacket;

        console.log(diff);

        const timeoutLimit = (this.packetsReceived === 0) ? this.initialTimeout : this.additionTimeout;


        if(diff > timeoutLimit){
            this.bFinished = true;
            this.events.emit("finished");
            return;
        }

        if(diff > this.initialTimeout){ 
            this.bFinished = true;
            this.events.emit("timeout");
        }else{
            this.bFinished = true;
            this.events.emit("finished");
        }        

        this.lastPacket = now;

    }

    receivedPacket(responseId){

        if(responseId === 0) this.receivedBasic = true;
        if(responseId === 1) this.receivedGame = true;
        if(responseId === 2) this.receivedPlayers = true;

        const now = Date.now();

        if(this.bSinglePacketOnly){
            this.bFinished = true;
            this.events.emit("finished");
            return;
        }

        if(this.type === "full"){

            if(this.receivedBasic && this.receivedGame && this.receivedPlayers){

                console.log("FULL FINISHED");

                this.bFinished = true;
                this.events.emit("finished");
                return;
            }
        }

        this.lastPacket = now;
        this.packetsReceived++;
    }


    async sendFullReply(){

        //await this.messageChannel.send("oink");
        const fullReply = new serverQueryMessage(this.messageChannel);
        await fullReply.send();
        this.bSentMessageToDiscord = true;

    }
}

module.exports = ServerResponse;