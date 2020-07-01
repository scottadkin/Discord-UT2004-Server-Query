const Promise = require('promise');
const dgram = require('dgram');
const Discord = require('discord.js');
const geoip = require('geoip-lite');

//const fs = require('fs');

class UT2004Q{

    constructor(){

        this.createClient();

        this.pendingData = [];
        //this.currentPlayers = [];

        /*this.client.send(this.getPacket(0), 7778, '80.4.151.145', (err) =>{
            console.log(err);
        });*/

        /*
        this.client.send(this.getPacket(0), 32101, '81.30.148.29', (err) =>{
            console.log(err);
        });*/

        //this.client.send(this.getPacket(2), 7778, '80.4.151.145', (err) =>{
         //  console.log(err);
        //});

        //this.getServer('80.4.151.145',7777)
        
    }

    //80.4.151.145:7777

    getServer(ip, port, channel){

        const now = Date.now();

        //console.log(geoip.lookup(ip));

        const geo = geoip.lookup(ip);

        this.pendingData.push({
            "ip": ip,
            "port": port,
            "type": "full",
            "serverInfo": [],
            //"timestamp": now,
            "playersToGet": null,
            "players": [],
            "bCompleted": false,
            "channel": channel,
            "country": geo.country
        });

        this.client.send(this.getPacket(0), port + 1, ip, (err) =>{
            console.log(err);
        });

    }

    getMatchingPendingData(ip, port, type){

        let p = 0;
        //console.log("looking for "+ip+":"+port+" "+type);

        for(let i = 0; i < this.pendingData.length; i++){

            p = this.pendingData[i];

            if(p.ip === ip && p.port === port && p.type === type){
                return p;
            }

        }
        return null;
    }

    deletePendingData(ip, port, type){

        let p = 0;

        for(let i = 0; i < this.pendingData.length; i++){

            p = this.pendingData[i];

            if(p.ip === ip && p.port === port && p.type === type){
                    this.pendingData.splice(i,1);
                return;
            }

        }
    }

    createClient(){

        this.client = dgram.createSocket("udp4");

        this.client.on('listening', () =>{
            console.log("Listening for server responses");
        });

        this.client.on('error', (err) =>{

            console.log(err);
        });


        /**
         * Server responses always start with byte 0x80(128) fro Unreal Tournament 2004
         * fifth byte is the response type:
         * 0x00 = server info
         * 0x01 = game info
         * 0x02 = player info
         * 0x03 = gameinfo and player info ?
         */

        this.client.on('message', (message, rinfo) =>{

            //console.log(`${message}`);
            console.log(rinfo);

            let data = JSON.stringify(message);
            data = JSON.parse(data).data;


            if(data[4] === 0){

                this.parseServerInfo(data, rinfo.address);

            }else if(data[4] === 1){

                this.parseGameInfo(data, rinfo.address, rinfo.port);

            }else if(data[4] === 2){

               this.parsePlayerInfo(data, rinfo.address, rinfo.port);
                
            }else{
                console.log("Unknown server response");
            }
            
        });


        this.client.bind();
    }

    /**
     * byte 1 is the game id, for UT2004 is hex 0x80 or binary 128
     * byte 2 and 3 are always 0
     * byte 4 is the one you change for different responses, either 0, 1, 2, or 3.
     */

    getPacket(id){      

        const packets = [
            [128, 0, 0, 0], //server info 1 packet
            [128, 0, 0, 1], //detailed info 1 packet
            [128, 0, 0, 2], //player info 1 - 2 packets
            [128, 0, 0, 3] //packet 2 and 3 | 2 - 3 packets
        ];

        if(id < packets.length){

            let string = "";

            for(let i = 0; i < packets[id].length; i++){

                string += String.fromCharCode(packets[id][i]);
            }

            return string;     
        }

        return null;
    }


    //start of color data is binary 27(hex 1B) and the 3 following bytes following are R G B values
    //example 1B FF 00 00 == red
    //if totalBytes is set to -1 scan until first NULL byte, otherwise scan for totalBytes
    removeColorData(data, totalBytes){

        const bytes = [];

        let i = 0;

        for(i = 0; i < data.length; i++){
            
            //start of color data (always 4 bytes long)

            if(totalBytes < 0 && data[i] === 0){
                break;
            }

            if(data[i] == 27){
                //bytesRemoved += 4;
                i += 3;
            }else{
                bytes.push(data[i]);
            }

            if(totalBytes >= 0){
                if(i >= totalBytes){
                    break;
                }
            }

        }
        

        return {"string": bytes, "removed": i + 1 };
    }


    bReadableByte(byte){

        if(byte >= 32 && byte < 127){
            return true;
        }

        return false;
    }


    /**
     * First byte is the string length, this however seems to now be accurate
     * Last byte is always NULL(0x00)
     * Server name string always has a byte 0x02(Start of text byte) at the start so we delete it first
     */

    parseString(data, bServerName){
        
        if(bServerName != undefined){
            //remove start of string byte (02) only happens with server name
            data.splice(0,1);
        }

        const nameBytes = this.removeColorData(data, -1);

        let name = "";

        for(let i = 0; i < nameBytes.string.length; i++){

            if(this.bReadableByte(nameBytes.string[i])){
                name += String.fromCharCode(nameBytes.string[i]);
            }
        }

        data.splice(0, nameBytes.removed);

        return name;
    }

    /**
     * The data is split into 2 set of 4 bytes
     * Only the first byte contains the amount of players in each set, the result are always 0
     * First 4 are the amount of players in the server.
     * Second 4 are the max amount of players allowed in server.
     */

    parsePlayerCount(data){

        const currentPlayersByte = data[0];
        const maxPlayersByte = data[4];

        //remove player bytes
        data.splice(0, 8);

        return {"current": currentPlayersByte, "max": maxPlayersByte};
    }

    parseServerInfo(data, ip, port){


        const serverInfo = {
            "ip": ip
        };

        if(port != undefined){
            serverInfo.port = port - 1;
        }
        
        //remove first byte(game id 0x80 / 128)
        data.splice(0,1);

        //remove response code (always 0 for server info)
        data.splice(0, 1);

        //remove server id (never used) always 4 bytes long
        data.splice(0, 4);

        //remove server ip (never used) always 4 bytes long
        data.splice(0, 4);

        //get game query port, always 4 bytes, last 2 being 0, and first two being back to front
        const portHex = data[1].toString(16) + data[0].toString(16);

        serverInfo.port =  parseInt(portHex, 16);

        //remove server port bytes
        data.splice(0,4);

        //remove port for status query (never used) always 4 bytes
        data.splice(0,4);
        
        serverInfo.name = this.parseString(data, true);

        serverInfo.map = this.parseString(data);
        serverInfo.gametype = this.parseString(data);

        const playerCount = this.parsePlayerCount(data);

        serverInfo.currentPlayers = playerCount.current;
        serverInfo.maxPlayers = playerCount.max;    

        //next 4 bytes are the server ping (never used)
        data.splice(0, 4);

        //next 4 bytes are server flags (always 0)
        data.splice(0, 4);

        //next 4 bytes are skill level?
        data.splice(0, 4);

        //remove last byte
        data.splice(0,1);


       // console.log(serverInfo);

        //console.log("port = "+serverInfo.port);
        //console.log("ip = "+ip);
        const pendingMessage = this.getMatchingPendingData(ip, serverInfo.port, "full");

        //console.log(pendingMessage);

        if(pendingMessage != null){

            pendingMessage.playersToGet = serverInfo.currentPlayers;
            pendingMessage.serverInfo = serverInfo;

           // console.log("pending data ");
            //console.log(this.pendingData);


            this.client.send(this.getPacket(2), serverInfo.port + 1, ip, (err) =>{
                  console.log(err);
            });
        }
        
        return serverInfo;
    }

    getGameInfoKeyValue(data){

        let key = "";
        let value = "";

        let nullBytes = 0;
        
        let b = 0;

        for(let i = 0; i < data.length; i++){

            if(data[i] === 0){

                nullBytes++;

                if(nullBytes > 1){

                    data.splice(0, i + 1);
                    return {"key": key, "value": value};
                }

            }else{

                if(this.bReadableByte(data[i])){

                    b = String.fromCharCode(data[i]);

                    if(nullBytes === 0){
                        key += b;
                    }else{               
                        value += b;             
                    }
                }
            }
        }

        return null;
    }

    parseGameInfo(data, ip, port){

        //remove game byte
        data.splice(0, 1);
        //remove response type byte
        data.splice(0, 4);
        //console.log(data);

        //console.log(this.getGameInfoKeyValue(data));

        let result = 0;

        const gameInfo = [];

        while(result != null){

            result = this.getGameInfoKeyValue(data);

            if(result != null){
                gameInfo.push(result);
            }    
        }

       // console.log(gameInfo);

       return gameInfo;
    }

    /**
     * Each player packet has:
     * First 4 bytes are the player's internal player id
     * Next N bytes are the player's name (remember first byte is string length)
     * Next 4 bytes are the player's ping
     * Next 4 bytes are the player's score
     * Last 4 bytes are the players stats id and team id, first 3 don't seem to be used last byte is the team
     * team = 0 = spectator, 32 = red, 64 = blue
     */

    parsePlayer(data){

        const player = {
            "name": "Player",
            "id": -1,
            "ping": 0,
            "score": 0,
            "team": -1
        };

        player.id = data[0];

        //remove id bytes
        data.splice(0, 4);

        player.name = this.parseString(data, -1);

        player.ping = parseInt(data[0]) + parseInt(data[1]) + parseInt(data[2]) + parseInt(data[3]); //(? does this work with ping over 255)

        //remove ping bytes
        data.splice(0,4);

        player.score = parseInt(data[0]) + parseInt(data[1]) + parseInt(data[2]) + parseInt(data[3]);

        //remove score bytes
        data.splice(0,4);

        const teamByte = data[3];

        switch(teamByte){

            case 32: {  player.team = 0;} break;
            case 64: {  player.team = 1;} break;
        }
        //remove team bytes
        data.splice(0,4);

        return player;
    }

    parsePlayerInfo(data, ip, port){
        
        //remove game byte
        data.splice(0, 1);

        //remove status bytes
        data.splice(0, 4);

       // console.log(data);

        const players = [];

        while(data.length > 0){
            players.push(this.parsePlayer(data));
        }

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

        //console.table(players);

        const pendingMessage = this.getMatchingPendingData(ip, port - 1, "full");

       // console.log(pendingMessage);

        if(pendingMessage != null){

            console.log("Found matching players data");

            pendingMessage.players = pendingMessage.players.concat(players);

            if(pendingMessage.players.length >= pendingMessage.playersToGet - 1 && !pendingMessage.bCompleted){

                this.sendDiscordResponse(pendingMessage);
            }

        }else{
            console.log("No matching data found");
        }

        return players;
    }

    getTotalTeams(players){

        const foundTeams = [];

        for(let i = 0; i < players.length; i++){

            if(foundTeams.indexOf(players[i].team) == -1){

                foundTeams.push(players[i].team);
            }
        }

        return foundTeams.length;
    }

    setTeamFields(players){

        let dmTeam = "";
        let redTeam = "";
        let blueTeam = "";
        let spectators = "";

        const totalTeams = this.getTotalTeams(players);

        console.log("totalTeams = "+totalTeams);

        let p = 0;

        let currentString = "";

        const flagReg = /^(.+) \(([A-Z]{2})\)$/;

        let flagResult = "";

        for(let i = 0; i < players.length; i++){

            p = players[i];

            console.log(p.team);

            flagResult = flagReg.exec(p.name);

            if(flagResult != null){

                if(flagResult[2] == "UK"){

                    flagResult[2] = "GB";

                }else if(flagResult[2] == "EL"){
                    flagResult[2] = "GR";
                }
                
                p.name = `:flag_${flagResult[2].toLowerCase()}: ${flagResult[1]}`;
            }else{
                p.name = `:pirate_flag: ${p.name}`;
            }

            currentString = `${p.name} **${p.score}**\n`;

            

            //console.log(p.team);

            if(totalTeams > 1){

                if(p.team === 0){

                    redTeam += currentString

                }else if(p.team === 1){

                    blueTeam += currentString;

                }

            }else{
                dmTeam += currentString;
            }
        }

        const result = [];

        if(redTeam != ""){

            result.push({
                "name": ":red_square: Red Team",
                "value": redTeam,
                "inline": true
            });

        }

        if(blueTeam != ""){

            result.push({
                "name": ":blue_square: Blue Team",
                "value": blueTeam,
                "inline": true
            });
        }

        if(dmTeam != ""){

            result.push({
                "name": ":white_large_square: Players",
                "value": dmTeam,
                "inline": true
            });

        }

        //console.log(result);

        return result;
    }

    sendDiscordResponse(data){

        console.log("GOt all players data");

        const server = data.serverInfo;

        //console.log(server);
        data.bCompleted = true;

        let serverFlag = ":pirate_flag:";

        if(server.country != undefined){

            server.country = server.country.toLowerCase();

            if(server.country  == "uk"){

                server.country  = "gb";

            }else if(server.country  == "el"){
                server.country  = "gr";
            }
            
        }

        let description = `**Players ${server.currentPlayers}/${server.maxPlayers}\n`;
        description += `${server.gametype}\n${server.map}**`;

        const fields = this.setTeamFields(data.players);

        const reply = new Discord.MessageEmbed()
        .setColor("#000000")
        .setTitle(`:flag_${serverFlag}: ${server.name}`)
        .setDescription(description)
        .addFields(fields)
        .setFooter(`ut2004://${server.ip}:${server.port}`);

        data.channel.send(reply);

        this.deletePendingData(data.ip, data.port, "full");

        //console.log(pendingMessage);
    }
}


/*

const test = new UT2004Q();

setInterval(() =>{

    test.getServer('80.4.151.145',7777)
},5000);*/


module.exports = UT2004Q;