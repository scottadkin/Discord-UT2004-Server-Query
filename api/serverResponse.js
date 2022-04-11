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

        this.initialTimeout = 2000;
        //timeout between multiple packets of the game type
        this.additionTimeout = 500;
        
        this.created = Date.now();
        this.lastPacket = Date.now();

        this.serverInfo = {};
        this.gameInfo = {
            "mutators": [],
            "teamsInfo": []
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
            this.setTotalTeams();
            this.events.emit("finished");
            return;
        }

        if(diff > this.initialTimeout){ 
            this.bFinished = true;
            this.events.emit("timeout");
        }else{
            this.bFinished = true;
            this.setTotalTeams();
            this.events.emit("finished");
        }        

        this.lastPacket = now;

    }

    setTotalTeams(){

        let found = [];

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];
            
            //team names
            if(p.id === 0){

                this.gameInfo.teamsInfo.push({"name": p.name, "score": p.score});

                continue;
            }

            if(found.indexOf(p.team) === -1){
                found.push(p.team);
            }
        }

        if(found.length === 0){

            if(this.gameInfo.teamsInfo.length > 0){
                return this.gameInfo.teamsInfo.length;
            }
        }

        this.gameInfo.totalTeams = found.length;

    }

    receivedPacket(responseId){

        const now = Date.now();

        this.lastPacket = now;
        this.packetsReceived++;

        if(this.bSinglePacketOnly){
            this.bFinished = true;
            this.events.emit("finished");
            return;
        }
   
    }


    async sendFullReply(){

        const fullReply = new serverQueryMessage(this);
        await fullReply.send();
        this.bSentMessageToDiscord = true;

    }
}

module.exports = ServerResponse;