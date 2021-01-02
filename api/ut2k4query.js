const dgram = require('dgram');
const config = require('./config.json');
const ServerResponse = require('./serverresponse');
const dns = require('dns');
const Discord = require('discord.js');



class UT2k4Query{

    constructor(discordClient, servers, channels){

        this.createServer();

        this.packets = [
            '\x80\x00\x00\x00', //basic info
            '\x80\x00\x00\x01', //server info
            '\x80\x00\x00\x02', //player info
            '\x80\x00\x00\x03', //server info and player info
        ];

        this.lastPingInterval = null;
        this.lastAutoInterval = null;

        this.servers = servers;
        this.channels = channels;

        this.responses = [];

        this.tickLoop = null;
        this.tick();

        this.discordClient = discordClient;

    }

    tick(){

        this.tickLoop = setInterval( () =>{

           const now = Math.floor(Date.now() * 0.001);
            
            let newResponses = [];

            for(let i = 0; i < this.responses.length; i++){

                if(now - this.responses[i].timeStamp > config.responseTimeout){

                    if(!this.responses[i].bGotAllData){

                        if(this.responses[i].type == "full" && this.responses[i].channel !== null && !this.responses[i].bAuto){
                            this.responses[i].channel.send(`${config.failIcon} Server **${this.responses[i].ip}:${this.responses[i].port}** has Timed Out :timer:.`);
                        }
                    }

                   // this.responses[i] = null;
                    continue;
                }       

                newResponses.push(this.responses[i]);
            }
            
            this.responses = null;
            this.responses = newResponses;
            
            if(this.lastPingInterval === null || now - this.lastPingInterval >= config.serverInfoInterval){
                this.pingInterval();
            }

            if(this.lastAutoInterval === null || now - this.lastAutoInterval >= config.autoQueryInterval){
                this.autoQueryInterval();
            }

        }, 1000);
    }

    getBasicCount(){

        let total = 0;

        for(let i = 0; i < this.responses.length; i++){

            if(this.responses[i].type == 'basic'){
                total++;
            }
        }

        return total;
    }

    async pingInterval(){

        try{

            if(this.getBasicCount() <= 0){

                const servers = await this.servers.getAllIpPorts();

                for(let i = 0; i < servers.length; i++){

                    this.getServerBasic(servers[i].ip, servers[i].port);
                }

                this.lastPingInterval = Math.floor(Date.now() * 0.001);
            }

        }catch(err){
            console.trace(err);
        }
    }

    bIp(input){

        const reg = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/i;

        return reg.test(input);

    }

    getServerBasic(ip, port){

        try{

            if(!this.bIp(ip)){

                dns.lookup(ip,(err, address) =>{
    
                    if(err){
                        channel.message.send(`${config.failIcon} Not a valid domain!`);
                        
                    }else{
    
                        this.responses.push(new ServerResponse(address, port, "basic", null, ip, false, this.servers));
                        this.sendPacket(0, address, port);
                        
                    }
                });
    
            }else{
    
                this.responses.push(new ServerResponse(ip, port, "basic", null, null, false, this.servers));
                this.sendPacket(0, ip, port);
                
            }

        }catch(err){
            console.trace(err);
        }
    }

    getFullServer(ip, port, channel, bAuto){

        try{

            if(bAuto === undefined){
                bAuto = false;
            }

            if(!this.bIp(ip)){

                dns.lookup(ip, (err, address) =>{

                    if(err){
                        console.log(err);
                        channel.send(`${config.failIcon} Not a valid domain!`);
                    }else{

                        this.responses.push(new ServerResponse(address, port, "full", channel, ip, bAuto, this.servers));
                        this.sendPacket(0, address, port);
                        //this.sendPacket(1, address, port);
                        this.sendPacket(2, address, port);
                    }
                });

            }else{

                this.responses.push(new ServerResponse(ip, port, "full", channel, null, bAuto, this.servers));
                this.sendPacket(0, ip, port);
               // this.sendPacket(1, ip, port);
                this.sendPacket(2, ip, port);
            }

        }catch(err){
            console.trace(err);
        }
    }

    createServer(){

        this.server = dgram.createSocket("udp4");

        this.server.on('listening', () =>{

            console.log(`UT2k4Query is listening on port ${config.udpPort}`);

        });

        this.server.on('error', (err) =>{

            console.log(err);

        });

        this.server.on('message', (message, rinfo) =>{

            this.parsePacket(message, rinfo);

        });


        this.server.bind(config.udpPort);
    }


    sendPacket(packetType, ip, port){

        port = port + 1;

        this.server.send(this.packets[packetType], port, ip, (err) =>{

            if(err) console.trace(err);
        });
        
    }

    parsePacket(data, rinfo){

        ////memory leak starts from here

        const byteOffset = 4;

        const packetType = data[4];

        if(packetType === 0){ 
            this.parseBasicInfo(byteOffset, data, rinfo);
        }else if(packetType === 1){
            this.parseServerInfo(byteOffset, data, rinfo);
        }else if(packetType === 2){
            this.parsePlayerInfo(byteOffset, data, rinfo);
        }else{
             console.log(`Unknown packet type`);
        }


    }

    removeColorData(byteOffset, data){

        let output = "";

        let i = 1 + byteOffset;

        for(i; i < data.length; i++){

            if(data[i] === 27){
                i += 3;        
            }else{

                //null byte means end of current string
                if(data[i] === 0){
                    break;
                }

                if(data[i] >= 32 && data[i] < 127){
                    output += String.fromCharCode(data[i]);
                }   
            }
        }

        //include the string length byte
        i++;

        return {"string": output, "removedBytes": i - byteOffset};
    }

    parseString(byteOffset, data){

        let parsedData = this.removeColorData(byteOffset, data);

        parsedData.string = parsedData.string.replace(/\*/ig,'');
        parsedData.string = parsedData.string.replace(/`/ig,'');

       // return {"buffer": data.slice(parsedData.removedBytes), "string": parsedData.string};
        return {"string": parsedData.string, "removedBytes": parsedData.removedBytes};
    }

    bDMMap(name){

        const reg = /^dm-.+$/i;
        return reg.test(name)
    }

    bHaveTamInName(name){

        const reg = /tam/i;

        return reg.test(name);
    }

    parseBasicInfo(byteOffset, data, rinfo){

        const response = this.getMatchingResponse(rinfo.address, rinfo.port, true);

        if(response === null){
            
            return;
        }

        byteOffset += 6;

        let portByte1 = data[byteOffset].toString(16);
        let portByte2 = data[byteOffset + 2].toString(16);

        let port = parseInt(`${portByte2}${portByte1}`,16);

        response.setValue('port', port);
        byteOffset += 8;

        const serverName = this.parseString(byteOffset, data);
        response.setValue('name', serverName.string);
        byteOffset += serverName.removedBytes;

        const mapName = this.parseString(byteOffset, data);
        response.setValue('map', mapName.string);
        byteOffset += mapName.removedBytes;
        
        const gametype = this.parseString(byteOffset, data);
        
        response.setValue('gametype', gametype.string);

        if(config.labelAsTAM){

            if(this.bDMMap(mapName.string)){

                if(this.bHaveTamInName(serverName.string)){
                    response.setValue('gametype', "TAM");
                }
            }
        }

        byteOffset += gametype.removedBytes;

        const currentPlayers = parseInt(data[byteOffset],10);
        response.setValue('currentPlayers', currentPlayers);
        byteOffset += 4;


        const maxPlayers = parseInt(data[byteOffset],10);
        response.setValue('maxPlayers', maxPlayers);
        byteOffset += 4;

       // console.log(response);

       //memory leak after
        response.finishedStep(Discord, config.embedColor);


    }

    getOptionValue(byteOffset, data){

        const option = this.parseString(byteOffset, data);
        const value = this.parseString(byteOffset + option.removedBytes, data);

        return {"option": option.string, "value": value.string, "removedBytes": option.removedBytes + value.removedBytes}
    }

    parseServerInfo(byteOffset, data, rinfo){

        console.log(`parseServerInfo-------------------------------------------------------------------------------------------`);
        console.log(data);
        console.log(data.toString());

        //console.log(this.parseString(byteOffset, data));


        const options = [];

        let currentOption = [];

        while(byteOffset <= data.length){

           // options.push(this.getOptionValue(byteOffset, data));
           currentOption = this.getOptionValue(byteOffset, data);
           options.push({
               "option": currentOption.option,
               "value": currentOption.value,
           });

           byteOffset += currentOption.removedBytes;

        }

        console.log(options);
        

    }

    getDWord(data, startOffset){

        let value = 0;

        //console.log(`START OFFSET = ${startOffset}`);

        for(let i = 0; i < 4; i++){
            //console.log(`data[]offset = ${startOffset + i}`);
            value += data[startOffset + i];
        }

        return value;
    }

    parsePlayer(byteOffset, data){

        const player = {};

        player.id = data[byteOffset];

        //skip rest of player id bytes
        let removed = 4;
        byteOffset += 4;

        const name = this.parseString(byteOffset, data);
        
        player.name = name.string;
        byteOffset += name.removedBytes;
        removed += name.removedBytes;

  
        player.ping = this.getDWord(data, byteOffset);
        removed += 4;
        byteOffset += 4;

        player.score = this.getDWord(data, byteOffset);
        removed += 4;
        byteOffset += 4;

        player.team = this.getDWord(data, byteOffset);
        byteOffset += 4;
        removed += 4;

        if(player.team == 32){
            player.team = 0;
        }else if(player.team == 64){
            player.team = 1;
        }else{
            player.team = -1;
        }

        return {"player": player, "removed": removed}
    }

    parsePlayerInfo(byteOffset, data, rinfo){

        const response = this.getMatchingResponse(rinfo.address, rinfo.port);

        if(response === null){
            return;
        }

        const players = [];

        //remove packet id byte
        byteOffset += 1;

        let currentPlayer = 0;

        while(byteOffset < data.length){

            currentPlayer = this.parsePlayer(byteOffset, data);
            byteOffset += currentPlayer.removed;
            players.push(currentPlayer.player);

        }

        response.setValue('players', players);

        response.finishedStep(Discord, config.embedColor);

    }

    getMatchingResponse(ip, port, bBasic){

        let r = 0;
        port = port - 1;
        
        for(let i = 0; i < this.responses.length; i++){

            r = this.responses[i];

            if(r.ip == ip && r.port == port && !r.bGotAllData){

                if(r.type === 'basic' && bBasic !== undefined){

                    if(!r.bGotBasic){
                        return r;
                    }

                }else{
                    return r;
                }           
            }
        }

        return null;
    }

    async autoQueryInterval(){

        try{
            
            const now = Math.floor(Date.now() * 0.001);

            this.lastAutoInterval = now;

            const servers = await this.servers.getAllIpPorts();

            const autoChannelId = await this.channels.getAutoQueryChannel();

            if(autoChannelId !== null){

                const dc = await this.discordClient.channels.fetch(autoChannelId);

                if(dc !== undefined){

                    for(let i = 0; i < servers.length; i++){

                        this.getFullServer(servers[i].ip, servers[i].port, dc, true);

                    }
                }
            }

        }catch(err){
            console.trace(err);
        }



        /*this.autoQueryLoop = setInterval(async () =>{

            //console.log(`Autoquery loop`);

            try{

                const servers = await this.servers.getAllServers();

                const autoChannelId = await this.channels.getAutoQueryChannel();

                if(autoChannelId !== null){

                    const dc = await this.discordClient.channels.fetch(autoChannelId);

                    if(dc !== undefined){
                        
                        for(let i = 0; i < servers.length; i++){

                            this.getFullServer(servers[i].ip, servers[i].port, dc, true);
                        }
                    }

                }else{
                    console.log(`autoChannelID is not set.`);
                }

            }catch(err){
                console.trace(err);
            }

        }, config.autoQueryInterval * 1000);*/
    }
}

module.exports = UT2k4Query;