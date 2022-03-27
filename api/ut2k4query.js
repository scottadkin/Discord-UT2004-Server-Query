
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
        
            //console.log(msg[0]);
           // console.log(JSON.stringify(msg));
            //console.log("message");
           ///console.log(`${msg}`);
           // console.log(rinfo);

            msg = this.removeServerResponse(msg);
            const responseId = msg[0];
            msg = this.removeResponseId(msg);
            msg = this.removeServerId(msg);
            msg = this.removeServerIp(msg);
            msg = this.removeServerPort(msg);
            msg = this.removeQueryPort(msg);


           

            if(responseId === 0){
                console.log(this.parseBasicInfo(rinfo.address, rinfo.port, msg));
            }else{
                console.log(`Unknown response id`);
            }
        });
        
        this.server.on("listening", () =>{
        
            console.log("Listening");
        });
        
        this.server.bind(13438);
        
        //this.server.send(`\x80\x00\x00\x01`, testPort + 1, testIp);
    }

    fetchBasicInfo(ip, port){

        this.server.send(`\x80\x00\x00\x00`, port, ip);
        //this.server.send(`\x80\x00\x00\x01`, port, ip);
        //this.server.send(`\x80\x00\x00\x02`, port, ip);
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


    async parseBasicInfo(ip, port, content){



        console.log(`parsing basic info. For: ${ip}:${port - 1}`);

        const jsonData = JSON.parse(JSON.stringify(content));


        

        content = this.removeColorData(content);

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
            "serverName": serverName,
            "mapName": mapName,
            "gametypeName": gametypeName,
            "players": {"current": currentPlayers, "max": maxPlayers}
        };

    }

}

module.exports = UT2K4Query;