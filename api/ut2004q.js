const Promise = require('promise');

const dgram = require('dgram');
const Discord = require('discord.js');
//const geoip = require('geoip-lite');
const config = require('./config');
//const countryList = require('country-list');
const Servers = require('./servers');




class UT2004Q{

    constructor(discordClient){

        this.database = require('./database');

        this.createClient();

        this.servers = new Servers();
        this.discord = discordClient;

        this.pendingData = [];       

        this.autoQueryLoop = null;
        this.serverPingLoop = null;

        
        //checks for timeouts
        
        /*setInterval(() =>{

            //console.log(process.memoryUsage());

            const m = process.memoryUsage();

            console.log(`RSS = ${(m.rss / 1024 / 1024).toFixed(2)}MB heapTotal = ${(m.heapTotal / 1024 / 1024).toFixed(2)}MB heapUsed= ${(m.heapUsed / 1024 / 1024).toFixed(2)}MB external = ${(m.external / 1024 / 1024).toFixed(2)}MB`);
            //console.log(`heapTotal = ${m.heapTotal / 1024}KB`);
            //console.log(`heapTotal = ${(m.heapTotal / 1024 / 1024).toFixed(2)}MB heapUsed= ${(m.heapUsed / 1024 / 1024).toFixed(2)}MB`);
           // console.log(`external = ${m.external / 1024}KB`);

            this.tick();
        }, 250);*/
        
        //loop for server pings
        this.serverPingLoop = setInterval(() =>{

            this.pingServerList();

        },config.serverPingInterval * 1000);


       this.startAutoQueryLoop();
        

    }

    async startAutoQueryLoop(){

        //return;
        try{

            this.pendingData = [];
            
            clearInterval(this.autoQueryLoop);

            await this.autoQuery();

            this.autoQueryLoop = setInterval(async () =>{
                //console.log("Auto Query");
                await this.autoQuery();

            }, config.autoQueryInterval * 1000);

        }catch(err){
            console.trace(err);
        }
    }

    async stopAuto(message){

        try{

           // console.log("STOP AUTO");
            clearInterval(this.autoQueryLoop);

            await this.servers.resetAutoChannel();
            message.channel.send(`Auto server query has been disabled.`);

        }catch(err){
            console.trace(err);
        }
    }

    //PASS CHANNEL ID INSTEAD OF CHANNEL OBJECT TO SEE IF THAT FIXES MEMORY LEAK

    async deleteOldAutoQueryMessages(timeStamp){

        try{

            //console.log(this.discord.client);

            const autoChannelId = await this.servers.getAutoChannel();

            if(autoChannelId !== null){

                const channel = await this.discord.channels.fetch(autoChannelId);

                if(autoChannelId >= 0){

                    const messagesResponse = await channel.messages.fetch({"limit": 50});

                    const messages = messagesResponse.array();

                    for(let i = 0; i < messages.length; i++){
                        //console.log(messages[i]);

                      //  console.log(`LIMIT = ${timeStamp} Message timestamp = ${messages[i].createdTimestamp}`);

                        if(messages[i].createdTimestamp < timeStamp){

                            messages[i].delete().then(() =>{
                               // console.log("deleted message");
                            }).catch((err) =>{
                                console.trace(err);
                            });     
                        } 

                    }


                }else{
                    //console.log("autoChannelId < 0");
                }
            }

        }catch(err){
            console.trace(err);
        }
    }



    async changeAutoQuery(message){

        try{

            this.pendingData = [];

            const now = Date.now();

            await this.servers.changeAutoChannel(message);

            await this.deleteOldAutoQueryMessages(now);

            this.startAutoQueryLoop();

        }catch(err){
            console.trace(err);
        }
    }

    async autoQuery(){

        try{

            const autoChannelId = await this.servers.getAutoChannel();

            if(autoChannelId !== null){

                const servers = await this.servers.getAllServers();

                let i = 0;

                let test = setInterval(async () =>{

                    await this.getServer(servers[i].ip, servers[i].port, autoChannelId);

                    i++;

                    if(i >= servers.length){
                        clearInterval(test);
                    }

                }, 800);
            }

        }catch(err){
            console.log(err);
        }

    }

    async pingServerList(){

        try{
            
            const servers = await this.servers.getAllServers();

            for(let i = 0; i < servers.length; i++){

                setTimeout(() =>{
                    const s = servers[i];
                    this.getServerBasic(s.ip, s.port);

                }, 500);
            }

        }catch(err){
            console.trace(err);
        }
    }

    tick(){

        //console.log("Looking for timedout data");

        let p = 0;

        const now = Math.floor(Date.now() * 0.001);

        for(let i = 0; i < this.pendingData.length; i++){

            p = this.pendingData[i];

            //console.log(now - p.created);

            if(now - p.created >= config.serverPingInterval * 3){

                //console.log(p);
                //console.log(p.type);
                
                if(p.serverInfo != []){

                    if(p.type == "full"){
                        //console.log("mewoeowoewoew");
                        this.sendDiscordResponse(p);
                    }

                }else{
                    p.channel.send(`**Server ${p.ip}:${p.port} Timed Out!**`);
                }

                this.deletePendingData(p.ip, p.port, p.type);
                //console.log("Server timeout");
            }

        }
    }

    //80.4.151.145:7777

    async getServerBasic(ip, port){

        try{

            const finalIp = await this.servers.getIp(ip);

            if(finalIp != null){
                ip = finalIp;
            }


            this.pendingData.push({
                "ip": ip,
                "port": port + 1,
                "type": "basic",
                "serverInfo": [],
                "created": Math.floor(Date.now() * 0.001)
            });

           /* this.client.send(this.getPacket(0), port, ip, (err) =>{
                if(err) console.log(err);
            });*/

            await this.sendPacket(0, port, ip)

        }catch(err){
            console.trace(err);
        }
    }

    sendPacket(packetType, port, ip){

        return new Promise((resolve, reject) =>{

            port = port + 1;

            this.client.send(this.getPacket(packetType), port, ip, (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    async getServer(ip, port, channelId){

        try{

            //console.log(`channelId = ${channelId}`);
            //const channel = await this.discord.channels.fetch(channelId);

            //console.log(`channel = ${channel}`);

            const finalIp = await this.servers.getIp(ip);

            if(finalIp != null){
                ip = finalIp;
            }

            //let geo = geoip.lookup(ip);

            //if(geo == null){

               let geo = {"country": "xx", "city": ""};
            //}

            this.deletePendingData(ip, port, "full");

            this.pendingData.push({
                "ip": ip,
                "port": port,
                "type": "full",
                "serverInfo": [],
                "playersToGet": null,
                "players": [],
                "bCompleted": false,
                "channel": channelId,
                "country": geo.country,
                "city": geo.city,
                "created": Math.floor(Date.now() * 0.001),
                "playerPackets": 0
            });

            /*this.client.send(this.getPacket(0), port + 1, ip, (err) =>{
                if(err) throw new Error(err);
            });*/

            await this.sendPacket(0, port, ip);

        }catch(err){    
            console.trace(err);
        }

    }

    getMatchingPendingData(ip, port, type){
     
        let p = 0;

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

        const result = [];

        for(let i = 0; i < this.pendingData.length; i++){

            p = this.pendingData[i];

            if(p.ip != ip && p.port != port && p.type != type){
                result.push(p);
            }
        }

        this.pendingData = result;
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

            if(rinfo === null || message === null){
                return;
            }

            let data = JSON.stringify(message);
            data = JSON.parse(data).data;

            if(data[4] === 0){

                this.parseServerInfo(data, rinfo.address);

            }else if(data[4] === 1){

                this.parseGameInfo(data, rinfo.address, rinfo.port);

            }else if(data[4] === 2){

               this.parsePlayerInfo(data, rinfo.address, rinfo.port);
                
            }

            data = null;
            
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
                //console.log("REMOVING COLOR BYTES");
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
     * First byte is the string length, this however seems to not be accurate
     * Last byte is always NULL(0x00)
     * Server name string always has a byte 0x02(Start of text byte) at the start so we delete it first
     */

    parseString(data, bServerName){
        

        //remove string length byte
        data.splice(0,1);
        

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

    async parseServerInfo(data, ip, port){

        try{

            const serverInfo = {
                "ip": ip,
                "port": 0,
                "name": "",
                "gametype": "",
                "map": "",
                "currentPlayers": 0,
                "maxPlayers": 0
            };

            if(port != undefined){
                serverInfo.port = port - 1;
            }
            //console.log(data);
            
            //remove first byte(game id 0x80 / 128)
            data.splice(0,1);

            //remove response code (always 0 for server info)
            data.splice(0, 1);

            //remove server id (never used) always 4 bytes long
            data.splice(0, 4);

            //console.log(data);
            //remove server ip (never used) always 4 bytes long
            data.splice(0, 4);


            //get game query port, always 4 bytes, last 2 being 0, and first two being back to front
            
            data[0] = data[0].toString(16);
            data[1] = data[1].toString(16);

            //this fixes hex not including leading 0
            if(data[0].length < 2){
                data[0] = "0"+data[0];
            }

            if(data[1].length < 2){
                data[1] = "0"+data[1];
            }

        // console.log("data[1] = "+data[1]+" data[0] = "+data[0]);


            const portHex = ''+data[1].toString(16)+'' + ''+data[0].toString(16)+'';
            

            //console.log("portHex = "+portHex);


            serverInfo.port =  parseInt(portHex, 16);

            //remove server port bytes
            data.splice(0,4);

            //remove port for status query (never used) always 4 bytes
            data.splice(0,4);

            //console.log(data);
            
            serverInfo.name = this.parseString(data, true);


            serverInfo.map = this.parseString(data);
            serverInfo.gametype = this.parseString(data);

            const playerCount = this.parsePlayerCount(data);

            //console.log(data);

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


            //console.log(serverInfo);

        // console.log(serverInfo);

            //console.log("port = "+serverInfo.port);
        // console.log("ip = "+ip);
            const pendingMessage = this.getMatchingPendingData(ip, serverInfo.port, "full");

            //console.log(pendingMessage);

        //  console.log(serverInfo);

            if(pendingMessage != null){

                pendingMessage.playersToGet = serverInfo.currentPlayers;
                pendingMessage.serverInfo = serverInfo;

            // console.log("pending data ");
                //console.log(this.pendingData);


                if(serverInfo.currentPlayers > 0){

                    await this.sendPacket(2, serverInfo.port, serverInfo.ip);
                    /*this.client.send(this.getPacket(2), serverInfo.port + 1, ip, (err) =>{

                        if(err) console.log(err);
                    });*/

                }else{
                // console.log(pendingMessage)


                    this.sendDiscordResponse(pendingMessage);
                
                }
                
            }else{

                //console.log("not matching data, so it's just a basic server ping.");

                //const basicPendingMessage = this.getMatchingPendingData(ip, serverInfo.port, "basic");

                //console.log("basicpendingMessage below");
                //console.log(basicPendingMessage);

            // if(basicPendingMessage !== null){
                    this.servers.updateServer(serverInfo);
                    
            // }

                this.deletePendingData(ip, serverInfo.port, "basic");
                
        
            }
            
            return serverInfo;
        }catch(err){
            console.trace(err);
        }
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

        //console.log(data);

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

        //console.log(`${player.name} has team byte ${teamByte}`);

        switch(teamByte){

            case 32: {  player.team = 0;} break;
            case 64: {  player.team = 1;} break;
        }
        //remove team bytes
        data.splice(0,4);

        //console.log(player);
        return player;
    }


    sortPlayersByScore(players){

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
        //return players;
    }

    removeDuplicatePlayers(players){

        const result = [];
        const names = [];

        let p = 0;

        for(let i = 0; i < players.length; i++){

            p = players[i];

            if(names.indexOf(p.name) === -1){
                names.push(p.name);
                result.push(p);
            }
        }

        return result;
    }

    parsePlayerInfo(data, ip, port){
        
        //remove game byte
        data.splice(0, 1);

        //remove status bytes
        data.splice(0, 4);

       // console.log(data);

        let players = [];

        while(data.length > 0){
            players.push(this.parsePlayer(data));
        }

        this.sortPlayersByScore(players);

        const pendingMessage = this.getMatchingPendingData(ip, port - 1, "full");



        if(pendingMessage != null){

            //console.log("Found matching players data");

            //pendingMessage.playerPackets++;

            pendingMessage.players = pendingMessage.players.concat(players);

            pendingMessage.players = this.removeDuplicatePlayers(pendingMessage.players);

            this.sortPlayersByScore(pendingMessage.players);

            if(pendingMessage.players.length >= pendingMessage.playersToGet - 1 && !pendingMessage.bCompleted){
            //if(pendingMessage.players.length >= pendingMessage.playersToGet - 1 || pendingMessage.playerPackets == 2){
                pendingMessage.bCompleted = true;

               // console.log("wooofofofof");
                this.sendDiscordResponse(pendingMessage);
            }

        }else{
            //console.log("No matching data found");
            
        }


        return players;
    }

    getTotalTeams(players){

        if(players === undefined) return 0;

        const foundTeams = [];

        for(let i = 0; i < players.length; i++){

            //dont class spectators as a team
            if(players[i].team === -1){

                if(players[i].id === 0){
                    foundTeams.push(i + 999);
                }

                continue;
            }


            if(foundTeams.indexOf(players[i].team) == -1){

                foundTeams.push(players[i].team);
            }

        }

        //console.log(foundTeams);

        return foundTeams.length;
    }

    getTeamScore(players, teamId){

        let findA = "red team";
        //find B is for brightskin support, team names are different (East side, West Side)
        let findB = "east side";

        if(teamId == 1){
            findA = "blue team";
            findB = "west side";
        }

        let p = 0;
        let currentName = "";

        for(let i = 0; i < players.length; i++){

            p = players[i];

            if(p.id === 0){

                currentName = p.name.toLowerCase();

                if(currentName === findA || currentName === findB || currentName === findA +" score" || currentName === findB + " score"){
                    return p.score;
                }
            }
        }

        return "";
    }

    setTeamFields(players, bIgnoreSpectators){

       // console.log(players);
        let dmTeam = "";
        let redTeam = "";
        let blueTeam = "";
        let spectators = "";

        const totalTeams = this.getTotalTeams(players);

        let p = 0;

        let currentString = "";

        const flagReg = /^(.+) \(([A-Z]{2})\)$/;

        let flagResult = "";

        for(let i = 0; i < players.length; i++){

            p = players[i];

            //team scores are always id 0
            if(p.id === 0){
               // continue;
            }

            if(p.name.toLowerCase() == "demorecspectator"){
                console.log("demorecspectator found ignoring.");
                continue;
            }

            if(p.id !== 0){

                flagResult = flagReg.exec(p.name);

                if(!p.name.startsWith(":flag_") && !p.name.startsWith(":video_game")){
                    if(flagResult !== null){

                        if(flagResult[2] == "UK"){

                            flagResult[2] = "GB";

                        }else if(flagResult[2] == "EL"){
                            flagResult[2] = "GR";
                        }
                        
                        p.name = `:flag_${flagResult[2].toLowerCase()}: ${flagResult[1]}`;

                    }else{
                        p.name = `:video_game: ${p.name}`;
                    }
                }
                
                currentString = `${p.name} **${p.score}**\n`;
            }

            if(totalTeams > 1){

                if(p.team === 0){

                    redTeam += currentString;

                }else if(p.team === 1){

                    blueTeam += currentString;

                }else{

         
                    if(p.id !== 0){
                        spectators += `${p.name} `;
                    }
                  
                }

            }else{
                dmTeam += currentString;
            }
        }

        const result = [];

  
        //console.log(players);

        if(totalTeams >= 2){

            if(redTeam === ""){
                redTeam = "No Players.";
            }

            result.push({
                "name": `:red_square: Red Team ${this.getTeamScore(players, 0)}`,
                "value": redTeam,
                "inline": true
            });


            if(blueTeam === ""){
                blueTeam = "No Players.";
            }

            result.push({
                "name": `:blue_square: Blue Team ${this.getTeamScore(players, 1)}`,
                "value": blueTeam,
                "inline": true
            });

        }
      

        if(dmTeam != ""){

            result.push({
                "name": ":white_large_square: Connections",
                "value": dmTeam,
                "inline": true
            });
        }

        if(players.length === 0){

            result.push({
                "name": ":zzz: Players",
                "value": "There are currently no players on the server.",
                "inline": true
            });
        }

        if(!bIgnoreSpectators){
            if(spectators == ""){
                spectators = "There are currently no spectators.";
            }

            result.push({
                "name": ":eye: Spectators ",
                "value": spectators,
                "inline": false
            });
        }

        //console.log(result);

        return result;
    }


    getTotalPlayers(players, bDm){

        let total = 0;

        let p = 0;

        for(let i = 0; i < players.length; i++){

            p = players[i];

            if(p.id != 0 && p.name.toLowerCase() !== "demorecspectator"){

                if(bDm){
                    total++;
                }else{

                    if(p.team !== -1){
                        total++;
                    }
                }
            }
        }

        return total;
    }

    async sendDiscordResponse(data){

        try{
    
            const server = data.serverInfo;

            const autoQueryChannelId = await this.servers.getAutoChannel();

            const channel = await this.discord.channels.fetch(data.channel);

            if(server.ip === undefined){
                //dont post timeouts to autoquery channel
                if(data.channel != autoQueryChannelId){
                    this.deletePendingData(data.ip, data.port, "full");
                    channel.send(`${data.ip}:${data.port} **Server Timedout!**`);
                }

                return;
            }

            let playerCountString  = `Players ${this.getTotalPlayers(data.players, false)}/${server.maxPlayers}`;

            const totalTeams = this.getTotalTeams(data.players);

            if(totalTeams < 2 && this.getTotalPlayers(data.players, true) > 0){
                playerCountString = `${this.getTotalPlayers(data.players, true)} Users Connected.`;
            }

           // let description = `:office: **${data.city}${countryName}\n:wrestling: ${playerCountString}\n`;
            let description = `**:wrestling: ${playerCountString}\n`;
            description += `:pushpin: ${server.gametype}**\n:map: **${server.map}**`;

            const fields = this.setTeamFields(data.players, (totalTeams < 2) ? true : false);

            const reply = new Discord.MessageEmbed()
            .setColor("#000000")
            //.setTitle(`${serverFlag} ${server.name}`)
            .setTitle(`${server.name}`)
            .setDescription(description)
            .addFields(fields)
            .addField("Join server as Player",`**<ut2004://${server.ip}:${server.port}>**`, false)
            .addField("Join server as Spectator",`**<ut2004://${server.ip}:${server.port}?spectatorOnly=1>**`, false)
            .setTimestamp();

            //if auto query channel doesn't have a message already for this channel create a new one
               
            const lastAutoQueryMessageId = await this.servers.getAutoQueryMessageid(server.ip, server.port);

           // console.log("lastAutoQueryMessageId = "+ lastAutoQueryMessageId);
            
            if(data.channel == autoQueryChannelId){

                if(lastAutoQueryMessageId === null){

                    //console.log("No previous auto query message");
                    const response = await channel.send(reply);
                    await this.servers.setServerMessageId(server.ip, server.port, response.id, 0);

                }else{

                    //console.log("Editing old post");

                    if(lastAutoQueryMessageId != -1){
                        const oldMessage = await channel.messages.fetch(lastAutoQueryMessageId);
                        await oldMessage.edit(reply);
                    }else{
                        const response = await channel.send(reply);
                        await this.servers.setServerMessageId(server.ip, server.port, response.id, 0);
                    }
            
                }            

            }else{
                await channel.send(reply);
            }
            
            this.deletePendingData(data.ip, data.port, "full");

        }catch(err){
            console.log(err);
        }
    }

}


module.exports = UT2004Q;