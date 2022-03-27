
const dgram = require("dgram");
const { Buffer } = require('buffer');


class UT2K4Query{

    constructor(){

        this.server = dgram.createSocket("udp4");

        this.createServerEvents();

        this.pendingData = [];
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

                this.parseServerInfo(rinfo.address, rinfo.port, msg);
                console.log(`Unknown response id`);
            }
        });
        
        this.server.on("listening", () =>{
        
            console.log("Listening");
        });
        
        this.server.bind(13438);
        
    }

    fetchBasicInfo(ip, port){

        this.server.send(`\x80\x00\x00\x00`, port, ip);
    }

    fetchServerInfo(ip, port){
        this.server.send(`\x80\x00\x00\x01`, port, ip);
    }

    fetchPlayerInfo(ip, port){
        this.server.send(`\x80\x00\x00\x02`, port, ip);
    }

    fetchServerInfoAndPlayerInfo(ip, port){
        this.server.send(`\x80\x00\x00\x03`, port, ip);
    }

    removeServerResponse(data){

        return data.slice(4, data.length - 1);
    }

    removeResponseId(data){

        return data.slice(1, data.length - 1);
    }

    removeServerId(data){
        return data.slice(4, data.length - 1);
    }

    removeServerIp(data){
        return data.slice(1, data.length - 1);
    }

    removeServerPort(data){
        return data.slice(4, data.length - 1);
    }

    removeQueryPort(data){
        return data.slice(4, data.length - 1);
    }

    removeColorData(data){

        for(let i = 0; i < data.length; i++){

            const d = parseInt(data[i]);

            if(d === 27){

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
            if(d < 32) continue;

            
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

}

module.exports = UT2K4Query;