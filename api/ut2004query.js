
const dgram = require('dgram');
const emitter = require('events').EventEmitter;

/**
 * 
 * USE sqlite
 */

class UT2004Query{

    constructor(port){

        this.port = port;

        this.createQueries();
        this.createSocket();
        this.em = new emitter();

        //81.30.148.29:32100
        //	80.4.151.145:5777

        //this.pingServerBasic('80.4.151.145', 7777);
        
        /*
        //mia server
        this.pingServerBasic('80.4.151.145', 7777);
        this.pingServerGameInfo('80.4.151.145', 7777);
        this.pingServerPlayerInfo('80.4.151.145', 7777);
        */
        

        
        //Fair-Gamers UT2004 DM Rankin-only Server #21
        /*
        this.pingServerBasic('81.30.148.29', 32100);
        this.pingServerGameInfo('81.30.148.29', 32100);
        this.pingServerPlayerInfo('81.30.148.29', 32100);*/



        /*
        //3spn server
        this.pingServerBasic('80.4.151.145', 5777);
        this.pingServerPlayerInfo('80.4.151.145', 5777);
        //UT comp server
        this.pingServerBasic('31.151.142.132',7777);
        */
        


    }

    pingServerBasic(ip, port){

        try{

            port = port + 1;

            this.client.send(this.createQueryPacket(0), port, ip, (err) =>{

                if(err) throw new Error(err);
            });

        }catch(err){
            console.trace(err);
        }
    }

    pingServerGameInfo(ip, port){

        try{

            port = port + 1;

            this.client.send(this.createQueryPacket(1), port, ip, (err) =>{

                if(err) throw new Error(err);
            });

        }catch(err){
            console.trace(err);
        }
    }

    pingServerPlayerInfo(ip, port){

        try{

            port = port + 2;

            this.client.send(this.createQueryPacket(0), port, ip, (err) =>{

                if(err) throw new Error(err);
            });

        }catch(err){
            console.trace(err);
        }
    }

    createQueries(){

        this.queries = [
            [ 128, 0, 0, 0], //server info in 1 packet
            [ 128, 0, 0, 1], //advanced server info in 1 packet
            [ 128, 0, 0, 2], //players info in 1 packet
            [ 128, 0, 0, 3] // advanced server info and players info in 2 packets
        ];

        //console.log(this.queries);
    }

    createQueryPacket(id){

        let packet = "";

        for(let i = 0; i < this.queries[id].length; i++){
            packet += String.fromCharCode(this.queries[id][i]);
        }
       // console.log("packet = "+packet);

        return packet;
    }

    createSocket(){

        this.client = dgram.createSocket("udp4");

        this.client.on('listening', () =>{

            console.log(`Listening for server response`);
        });

        this.client.on('message', (message, rinfo) =>{

            //console.log(rinfo);
            //console.log(`${message}`);

            this.parseData(message, rinfo.address);

           // console.log(this.parseServerInfo(message, rinfo.address));

        });

        this.client.on('error', (err) =>{
            console.trace(err);
            console.log(err);
        });


        if(this.port != undefined){
            this.client.bind(this.port);
        }else{
            this.client.bind();
        }
    }

    getOptionValuePair(data){

        let option = "";
        let value = "";

        let nullBytes = 0;

        let i = 0;

        for(i = 0; i < data.length; i++){

           // console.log(i);

            if(data[i] !== 0){

                if(nullBytes === 0){
                    option += String.fromCharCode(data[i]);
                }else{
                    value += String.fromCharCode(data[i]);
                }

            }else{

                nullBytes++;

                if(nullBytes > 1){
                    break;
                }
            }
        }

        option = option.slice(1);
        value = value.slice(1);
       // console.log(option+" - "+value);

        data.splice(0, i + 1);

        if(option != ""){
            return {"key": option, "value": value};
        }

        return null;
    }

    parseGameInfo(data){

        //console.log(data);

        //
        data.splice(0,4);

      //  console.log(data);

        let gameInfo = [];

        let result = "";

        while(result != null){

            result = this.getOptionValuePair(data);

            if(result != null){
                gameInfo.push(result);
            }

           // console.log(data);
        }

       // console.log(gameInfo);

        return gameInfo;


    }

    //server info packets always start with 8 bytes of value 0
    //If all are 0 then it must be a server info packet.

    bServerInfoPacket(data){

        for(let i = 0; i < 9; i++){

            if(data[i] !== 0){
                return false;
            }
        }

        return true;
    }

    bGameInfoPacket(data){

        if(data[3] === 1){
            return true;
        }

        return false;
    }

    bPlayerInfoPacket(data){

        if(data[3] === 2){
            return true;
        }

        return false;
    }


    parseData(data, ip){

        data = JSON.stringify(data);

        data = JSON.parse(data).data;

        //console.log(data);

        //remove first byte(game id)

        data.splice(0,1);

        if(this.bServerInfoPacket(data)){

            console.log("server packet info");
            console.log(this.parseServerInfo(data, ip));

        }else if(this.bGameInfoPacket(data)){

            console.log("Game info packet");

            console.log(this.parseGameInfo(data));

        }else if(this.bPlayerInfoPacket(data)){
            
            console.log("player info packet");

            this.parsePlayerInfoPacket(data);

        }else{
            console.log("Unknown server packet");
            
          //  console.log(data);
        }

    }

    bReadableByte(char){

        if(char > 31 && char < 126){
            return true;
        }

        return false;
    }


    getServerPort(packet){

        //server port is always 4 bytes, last 2 normally empty
        const data = [];

        for(let i = 0; i < 4; i++){

            if(packet[i] != 0){
                data.push(packet[i].toString(16));
            }
        }

        let value = 0;

        // data is back to front in the reply.
        for(let i = data.length - 1; i >= 0; i--){

            value += data[i];
        }

        packet.splice(0,5);

        return parseInt(value, 16);

        
    }

    getServerName(data){

        return this.bytesToString(data);
    }

    bytesToString(data){

        let string = "";

        let i = 0;

        let d = 0;

        for(i = 1; i < data.length; i++){

            d = data[i];
            
            if(d === 0){
                //found null
                break;
            }else if(d === 27){
                //found start of color data(always 4 bytes long)
                i += 3; 
            }else{
                string += String.fromCharCode(d);
            }
        }

        if(arguments.length === 1){
            data.splice(0, i + 1);
        }

        return string;
    }

    getMapName(data){

        return this.bytesToString(data);

    }

    getGameName(data){
        return this.bytesToString(data);
    }

    getPlayerCount(data){

        let currentPlayers = null;
        let maxPlayers = null;

        currentPlayers = data[0];
        maxPlayers = data[4];

        data.splice(0,8);

        return {"currentPlayers": currentPlayers, "maxPlayers": maxPlayers}

    }

    parseServerInfo(data, ip){

        //data = JSON.stringify(data);
       // data = JSON.parse(data).data;

        if(data === undefined){
            console.trace(data);
            return;
        }


        //remove Id
        data.splice(0,1);

        //remove server id (always empty)
        data.splice(0,4);

        //remove server ip (always empty)
        data.splice(0, 4);

        const serverPort = this.getServerPort(data);

        //remove query port (always empty)
        data.splice(0,4);

        const serverName = this.getServerName(data);
        const mapName = this.getMapName(data);
        const gameName = this.getGameName(data);
        const playerCount = this.getPlayerCount(data);


        this.em.emit('basicPing', {
            "name": serverName,
            "ip": ip,
            "port": serverPort,
            "gametype": gameName,
            "map": mapName,
            "currentPlayers": playerCount.currentPlayers,
            "maxPlayers": playerCount.maxPlayers
        });

        return {
            "name": serverName,
            "ip": ip,
            "port": serverPort,
            "gametype": gameName,
            "map": mapName,
            "currentPlayers": playerCount.currentPlayers,
            "maxPlayers": playerCount.maxPlayers
        };
    }


    parsePlayerPing(data){

        let ping = 0;

        for(let i = 0; i < data.length; i++){

            ping += parseInt(data[i], 16);

        }

        return ping;
    }

    bytesToInt(data, start, amount){

        let value = 0;

        for(let i = start; i < start + amount; i++){
            
           // value += parseInt(data[i], 16);
            value += parseInt(data[i]);
        }

        return value;
    }

    parsePlayer(data){

        const player = {
            "name": "Player",
            "id": -1,
            "ping": 0,
            "score": 0,
            "team": -1,
            "flag": "xx"
        };

        let i = 0;

        //const idBytes = [];
        const nameBytes = [];


        player.id = data[0];

        i = 4;

        while(data[i] !== 0){

            nameBytes.push(data[i]);
            i++;
        }

        //console.log(nameBytes);
        //skip null byte
        i++;

        player.name = this.bytesToString(nameBytes);

        const playerFlagReg = /^.+ \((..)\)$/i;
        
        const flagResult = playerFlagReg.exec(player.name);

        if(flagResult != null){
            player.flag = flagResult[1].toLowerCase();
        }

        player.ping = this.bytesToInt(data, i, 4);
        //skip ping bytes
        i += 4;


        player.score = this.bytesToInt(data, i, 4);

        i+=4;

        //const statsBytes = [];

        //statsBytes.push(data[i + 3]);

        //not 100% sure
        //0 = spectator, 32 = red, 64 = blue

        const teamByte = data[i + 3];

        switch(teamByte){
            case 32: {  player.team = 0; } break;
            case 64: {  player.team = 1; } break;
        }
          
        i+=4;

        data.splice(0, i);
        

        return player;
    }

    parsePlayerInfoPacket(data){

        //remove first 4 bytes
        data.splice(0,4);

        const players = [];
    
        //console.log(this.parsePlayer(data));

        while(data.length >= 20){
            //console.log(data);
            players.push(this.parsePlayer(data));
            
            
        }

        //team score ids are always 0 and name Red Team or Blue Team
        console.table(players);

        this.em.emit('playersPing', players);

        players.sort((a, b) =>{

            a = a.score;
            b = b.score;

            if(a > b){
                return -1;
            }else if(a < b){
                return 1;
            }

            return 0;
        });
       // console.table(players);
  
    }
}

module.exports = UT2004Query;