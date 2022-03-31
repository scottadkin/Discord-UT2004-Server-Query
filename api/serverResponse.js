class ServerResponse{

    constructor(ip, port, type){

        this.ip = ip;
        this.port = port;
        this.type = type;
        this.created = Date.now();
        this.lastPacket = Date.now();

        this.timeout = 500;
        this.bTimedOut = false;

        this.serverInfo = {};
        this.gameInfo = {
            "mutators": []
        };

        this.bCompleted = false;
        this.packetsReceived = 0;
        
        console.log(this);

        console.log("new server response");
    }


    receivedPacket(){

        const now = Date.now();

        console.log(now - this.lastPacket);

        const diff = now - this.lastPacket;

        if(diff > this.timeout){

            this.bTimedOut = true;
        }

        this.lastPacket = now;
    }
}

module.exports = ServerResponse;