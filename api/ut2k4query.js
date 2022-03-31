
const dgram = require("dgram");
const { Buffer } = require("buffer");
const ServerResponse = require("./serverResponse");


class UT2K4Query{

    constructor(){

        this.server = dgram.createSocket("udp4");

        this.createServerEvents();

        this.serverResponses = {};
    }

    createServerEvents(){

        this.server.on("error", (err) =>{

            console.trace(err);
        
        });
        
        this.server.on("message", (msg, rinfo) =>{

            msg = this.removeServerResponse(msg);
            const responseId = msg[0];


            if(responseId === 0){

                console.log(this.parseBasicInfo(rinfo.address, rinfo.port, msg));

            }else if(responseId === 1){

                this.parseGameInfo(rinfo.address, rinfo.port, msg);
                
            }else{

                console.log(`Unknown response id`);
            }
        });
        
        this.server.on("listening", () =>{
        
            console.log("Listening");
        });
        
        this.server.bind(13438);
        
    }
    

    bServerResponseActive(ip, port, type){

        if(this.serverResponses[`${ip}:${port}${type}`] === undefined){
            return false;
        }

        return true;
    }

    createNewServerResponse(ip, port, type){

        if(!this.bServerResponseActive(ip, port, type)){

            this.serverResponses[`${ip}:${port}${type}`] = new ServerResponse(ip, port, type);

            const response = this.serverResponses[`${ip}:${port}${type}`];

            response.events.on("finished", () =>{

                console.log(response);
            });

            response.events.on("timeout", () =>{

                console.log("TIMED OUT");
            });

            console.log(`Need to create new response`);
        }else{
            console.log(`Already processing`);
        }
        
    }

    fetchBasicInfo(ip, port){

        this.createNewServerResponse(ip, port, "basic");
        this.server.send(`\x80\x00\x00\x00`, port, ip);
    }

    fetchGameInfo(ip, port){
        this.createNewServerResponse(ip, port, "game");
        this.server.send(`\x80\x00\x00\x01`, port, ip);
    }

    fetchPlayerInfo(ip, port){
        this.server.send(`\x80\x00\x00\x02`, port, ip);
    }

    fetchServerInfoAndPlayerInfo(ip, port){
        this.server.send(`\x80\x00\x00\x03`, port, ip);
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

        for(; i < length; i++){

            const d = data[i];

            if(d === 0) break;
   
            //ignore whitespace chars
            if(d < 32 || d === 255) continue;

            
            string += String.fromCharCode(d);
        }


        const newData = data.subarray(i + 1);

        return {"string": string, "data": newData};

    }

    removeJunkBasic(data){

        data = this.removeResponseId(data);
        data = this.removeServerId(data);
        data = this.removeServerIp(data);
        data = this.removeServerPort(data);
        data = this.removeQueryPort(data);
        data = this.removeColorData(data);

        return data;
    }

    parseBasicInfo(ip, port, content){


        content = this.removeJunkBasic(content);
        
        let currentStringResult = this.getNextString(content);
        const serverName = currentStringResult.string;

        currentStringResult = this.getNextString(currentStringResult.data);

        const mapName = currentStringResult.string;

        currentStringResult = this.getNextString(currentStringResult.data);

        const gametypeName = currentStringResult.string;

        content = currentStringResult.data;

        const playerCountBytes = content.subarray(0, 4);

        content = content.subarray(4);
        const maxPlayerBytes = content.subarray(0, 4);
     
        const currentPlayers = parseInt(playerCountBytes[0]);
        const maxPlayers = parseInt(maxPlayerBytes[0]);

        return {
            "ip": ip,
            "port": port,
            "serverName": serverName,
            "mapName": mapName,
            "gametypeName": gametypeName,
            "players": {"current": currentPlayers, "max": maxPlayers}
        };
    }

    getNextKeyValuePair(content){


        let currentResult = this.getNextString(content);

        const key = currentResult.string;

        currentResult = this.getNextString(currentResult.data);

        const value = currentResult.string;

        return {"data": currentResult.data, "key": key, "value": value};

    }

    parseGameInfo(ip, port, content){

        const debugData = JSON.parse(JSON.stringify(content)).data;
        content = this.removeResponseId(content);

        const serverResponse = this.serverResponses[`${ip}:${port}game`];
        serverResponse.receivedPacket();

        if(serverResponse === undefined){
            console.log(`ut2kquery.parseGameInfo(${ip},${port}) gameinfo is undefined`);
            return;
        }

        while(content.length > 0){

            //console.log(content);
            //console.log(JSON.parse(JSON.stringify(content)).data);
            const {data, key, value} = this.getNextKeyValuePair(content);

            if(key.toLowerCase() !== "mutator"){
                serverResponse.gameInfo[key] = value;
            }else{
                serverResponse.gameInfo.mutators.push(value);
            }

            content = data;
        }

        serverResponse.packetsReceived++;

    }
}

module.exports = UT2K4Query;