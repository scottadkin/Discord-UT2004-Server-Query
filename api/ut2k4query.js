
const dgram = require("dgram");
const { Buffer } = require("buffer");
const ServerResponse = require("./serverResponse");
const ServerResponseQueue = require("./serverResponseQueue");



class UT2K4Query{

    constructor(){

        this.server = dgram.createSocket("udp4");

        this.createServerEvents();

        //this.messages = new MessageResponseQueue();
        this.serverResponses = new ServerResponseQueue();
    }

    createServerEvents(){

        this.server.on("error", (err) =>{

            console.trace(err);
        
        });
        
        this.server.on("message", (msg, rinfo) =>{

            msg = this.removeServerResponse(msg);
            const responseId = msg[0];


            if(responseId === 0){

                this.parseBasicInfo(rinfo.address, rinfo.port, msg);

            }else if(responseId === 1){

                this.parseGameInfo(rinfo.address, rinfo.port, msg);
                
            }else if(responseId === 2){
                
                this.parsePlayerInfo(rinfo.address, rinfo.port, msg);

            }else{

                console.log(`Unknown response id`);
            }
        });
        
        this.server.on("listening", () =>{
        
            console.log("Listening");
        });
        
        this.server.bind(13438);
        
    }
    

    bServerResponseActive(ip, port){

        if(this.serverResponses.getResponse(ip, port) === null){
            return false;
        }

        return true;
    }

 
    createNewServerResponse(ip, port, type, messageChannel){

        if(!this.bServerResponseActive(ip, port, type)){

            const response = this.serverResponses.create(ip, port, type, messageChannel);

            console.log(`Need to create new response`);

            response.events.once("finished", async () =>{
                
                console.log(`I finished`);

                if(response.type === "full"){

                    await response.sendFullReply();
                }
            });

            response.events.once("timeout", async () =>{

                console.log("TIMED OUT");
                await response.sendFailedReply();
            });

            return true;

        }else{

            console.log(`Already processing`);
           // return false;
        }
        return false;
    }

    fetchBasicInfo(ip, port){

        if(this.createNewServerResponse(ip, port, "basic")){
            this.server.send(`\x80\x00\x00\x00`, port, ip);
        }
    }

    fetchGameInfo(ip, port){

        if(this.createNewServerResponse(ip, port, "game")){
            this.server.send(`\x80\x00\x00\x01`, port, ip);
        }
    }

    fetchPlayerInfo(ip, port){

        if(this.createNewServerResponse(ip, port, "players")){
            this.server.send(`\x80\x00\x00\x02`, port, ip);
        }
    }

    fetchServerInfoAndPlayerInfo(ip, port){

        if(this.createNewServerResponse(ip, port, "sandp")){
            this.server.send(`\x80\x00\x00\x03`, port, ip);
        }
    }

    fetchFullResponse(ip, port, messageChannel){

        if(this.createNewServerResponse(ip, port, "full", messageChannel)){
            this.server.send(`\x80\x00\x00\x00`, port, ip);
            this.server.send(`\x80\x00\x00\x01`, port, ip);
            this.server.send(`\x80\x00\x00\x02`, port, ip);
        }
    }

    removeServerResponse(data){

        return data.subarray(4, data.length - 1);
    }

    removeResponseId(data){

        return data.subarray(1, data.length - 1);
    }

    removeServerId(data){
        return data.subarray(4, data.length - 1);
    }

    removeServerIp(data){
        return data.subarray(1, data.length - 1);
    }

    removeServerPort(data){
        return data.subarray(4, data.length - 1);
    }

    removeQueryPort(data){
        return data.subarray(4, data.length - 1);
    }

    removeColorData(data){

        for(let i = 0; i < data.length; i++){

            const d = parseInt(data[i]);

            if(d === 27 && i !== 0){

                const start = data.subarray(0, i);
                const end = data.subarray(i + 4);

                const newBuffer = Buffer.concat([start, end], start.length + end.length);
                return this.removeColorData(newBuffer);
            }
        }
        
 

        return data;
    }


    getNextString(data){


        const length = parseInt(data[0]);

        let string = "";
        let i = 1;

        let d = 1;


        while(d !== 0){

            const d = parseInt(data[i]);

           // console.log(`${d} ${ String.fromCharCode(d)}`);

            if(d !== d || d === 0) break;

            if(d === 27){
                i+=4;
                continue;
            }

            if(d < 32){
                i++;
                continue;
            }

            
   
            string += String.fromCharCode(d);
            i++;
        }


        const newData = data.subarray(i + 1);

       // console.log(`string =============================================== ${string}`);

        return {"string": string, "data": newData};

    }

    removeJunkBasic(data){

        data = this.removeResponseId(data);
        data = this.removeServerId(data);
        data = this.removeServerIp(data);
        data = this.removeServerPort(data);
        data = this.removeQueryPort(data);
        //data = this.removeColorData(data);

        return data;
    }

    parseBasicInfo(ip, port, content){

        const serverResponse = this.serverResponses.getResponse(ip, port);

        if(serverResponse === null){

            console.log(`ut2kquery.parseBasicInfo(${ip},${port}) response is null`);
            return;
        }

        content = this.removeJunkBasic(content);

        const info = serverResponse.serverInfo;
        //console.log(content);
        let currentStringResult = this.getNextString(content);
        info.name = currentStringResult.string;

        currentStringResult = this.getNextString(currentStringResult.data);
        info.map = currentStringResult.string;
        
        currentStringResult = this.getNextString(currentStringResult.data);

        info.gametype = currentStringResult.string;

        content = currentStringResult.data;
        const playerCountBytes = content.subarray(0, 4);

        content = content.subarray(4);
        const maxPlayerBytes = content.subarray(0, 4);
     
        const currentPlayers = parseInt(playerCountBytes[0]);
        const maxPlayers = parseInt(maxPlayerBytes[0]);

        info.players = {"players": currentPlayers, "maxPlayers": maxPlayers};

        serverResponse.enableTick();
        serverResponse.receivedPacket(0);
       

    }

    getNextKeyValuePair(content){

        let currentResult = this.getNextString(content);

        const key = currentResult.string;

        currentResult = this.getNextString(currentResult.data);

        const value = currentResult.string;

        return {"data": currentResult.data, "key": key, "value": value};

    }



    parseGameInfo(ip, port, content){

        content = this.removeResponseId(content);

        const serverResponse = this.serverResponses.getResponse(ip, port);

        if(serverResponse === null){

            console.log(`ut2kquery.parseGameInfo(${ip},${port}) response is null`);
            return;
        }

        while(content.length > 0){

            const {data, key, value} = this.getNextKeyValuePair(content);

            if(key.toLowerCase() !== "mutator"){
                serverResponse.gameInfo[key] = value;
            }else{
                serverResponse.gameInfo.mutators.push(value);
            }

            content = data;
        }

        serverResponse.enableTick();
        serverResponse.receivedPacket(1);

    }


    getBytes(data, totalBytes, bSumBytes){

        bSumBytes = bSumBytes ?? false;

        let total = 0;

        const selectedBytes = data.subarray(0, totalBytes);

        if(bSumBytes){

            if(selectedBytes.length === 4){

                total = selectedBytes.readInt32LE(0); 

            }else if(selectedBytes.length === 2){

                total = selectedBytes.readInt16LE(0);
            }
        }

        data = data.subarray(totalBytes);

        return {"data": data, "value": (bSumBytes) ? total : selectedBytes};

    }


    getPlayerTeam(bytes){

       // console.log(bytes);

        let teamValue = 0;

        if(bytes.length === 2){

            teamValue = bytes[1];
        }else{
            teamValue = bytes[3];
        }

        //0 is red team
        //64 is blue team
        //32 is spectator

        return parseInt(teamValue);
    }


    getNextPlayer(content){

        const player = {
            "name": "",
            "id": 0,
            "ping": 0,
            "score": 0,
            "team": 0
        };

        //let result = this.getPlayerId(content);
        let result = this.getBytes(content, 4, true);
        player.id = result.value;

        result = this.getNextString(result.data);

        player.name = result.string;

        result = this.getBytes(result.data, 4, true);

        player.ping = result.value;


        result = this.getBytes(result.data, 4, true);
        player.score = result.value;
        
        result = this.getBytes(result.data, 4, false);

        const playerTeam = this.getPlayerTeam(result.value);
        player.team = playerTeam;

        content = result.data;

        //console.log(player);

        return {"data": content, "player": player};
        
    }

    parsePlayerInfo(ip, port, content){

        const serverResponse = this.serverResponses.getResponse(ip, port);

        if(serverResponse === null){

            console.log(`ut2kquery.parsePlayerInfo(${ip},${port}) response is null`);
            return;
        }

        content = this.removeResponseId(content);

        this.getNextPlayer(content);

        while(content.length > 0){

            const result = this.getNextPlayer(content);

            content = result.data;
         
            serverResponse.players.push(result.player);
        }

        serverResponse.players.sort((a, b) =>{

            a = a.score;
            b = b.score;

            if(a < b){
                return 1;
            }else if(a > b){
                return -1;
            }

            return 0;
        });

        serverResponse.enableTick();
        serverResponse.receivedPacket(2);
        
    }
}

module.exports = UT2K4Query;