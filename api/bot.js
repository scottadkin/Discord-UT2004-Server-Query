const config = require('./config.json');
const Database = require('./database');
const UT2k4Query = require('./ut2k4query');
const Discord = require('discord.js');
const Servers = require('./servers');
const dns = require('dns');
const Roles = require('./roles');
const Channels = require('./channels');



class Bot{

    constructor(){

        this.db = new Database().sqlite;
        this.servers = new Servers();
        this.roles = new Roles();
        this.channels = new Channels(this.servers);

        this.bDisabled = false;

        this.createClient();
    }

    createClient(){

        this.client = new Discord.Client({
            messageEditHistoryMaxSize: 0,
            messageCacheLifetime: 1,
            messageCacheMaxSize: 0,
            messageSweepInterval: 30
        });

        this.client.on('ready', () =>{

            console.log(`Who said that?!`);

            this.query = new UT2k4Query(this.client, this.servers, this.channels);

        });

        this.client.on('error', (err) =>{

            console.trace(err);
        });

        this.client.on('message', (message) =>{

            this.parseCommand(message);

        });

        this.client.login(config.discordToken);
    }

    disconnect(){

        console.log('disconnect');
        this.bDisabled = true;
        this.client.destroy();
    }


    async bUserAdmin(message){

        try{

            const user = message.member;

            const userRoles = user.roles.cache;

            const bDefaultAdmin = (elem) =>{

                if(elem.name.toLowerCase() === config.defaultAdminRole.toLowerCase()) return true;
                return false;
            }

            if(userRoles.some(bDefaultAdmin)){
               // console.log(`User is default admin role`);
                return true;
            }

            const addedRolesFull = await this.roles.getAllAddedRoles();

            const addedRoles = addedRolesFull.map((elem) =>{
                return elem.id;
            });

            const bAddedRole = (elem) =>{

                if(addedRoles.indexOf(elem.id) !== -1) return true;

                return false;
            }

            if(userRoles.some(bAddedRole)){
                //console.log(`User is an added admin role`);
                return true;
            }

            return false;

        }catch(err){
            console.trace(err);
        }
    }


    async bBotEnabledInChannel(channelId){

        try{

            const channels = await this.channels.getAllChannels(true);

            //console.table(channels);

            if(channels.indexOf(channelId) !== -1){
                return true;
            }

            return false;

        }catch(err){
            console.trace(err);
        }
    }


    async parseCommand(message){

        try{

            const text = message.content;

            if(text.startsWith(config.commandPrefix) && text.length > 1){

                if(text[1] === config.commandPrefix) return; //ignore to prevent false positives

                const serversReg = /^.servers$/i;
                const activeReg = /^.active$/i;
                const queryReg = /^.q .+$/i;
                const shortQueryReg = /^.q\d+$/i;
                const ipQueryReg = /^.ip\d+$/i;
                const helpReg = /^.help$/i;

                const adminRegs = [
                    /^.addserver .+$/i,
                    /^.deleteserver \d+$/i,
                    /^.editserver \d+ .+? .+?$/i,
                    /^.allowrole .+$/i,
                    /^.removerole .+$/i,
                    /^.roles$/i,
                    /^.allowchannel$/i,
                    /^.removechannel$/i,
                    /^.channels$/i,
                    /^.setauto$/i,
                    /^.disableauto$/i

                ];

                const bAdmin = await this.bUserAdmin(message);

                if(!bAdmin){

                    for(let i = 0; i < adminRegs.length; i++){

                        if(adminRegs[i].test(text)){

                            message.channel.send(`${config.failIcon} You do not have permission to use this command.`);
                            return;
                        }
                    }
                }
                
                if(bAdmin){

                    if(adminRegs[0].test(text)){

                        this.servers.addServer(message);
                        return;
        
                    }else if(adminRegs[1].test(text)){
        
                        this.servers.deleteServer(message);
                        return;
        
                    }else if(adminRegs[2].test(text)){
                        
                        this.editServer(message);
                        return;
        
                    }else if(adminRegs[3].test(text)){
                        
                        this.addRole(message);
                        return;

                    }else if(adminRegs[4].test(text)){

                        this.deleteRole(message);
                        return;

                    }else if(adminRegs[5].test(text)){

                        this.roles.displayAddedRoles(message.channel);
                        return;

                    }else if(adminRegs[6].test(text)){

                        this.channels.addChannel(message.channel);
                        return;

                    }else if(adminRegs[7].test(text)){

                        this.channels.removeChannel(message.channel);
                        return;

                    }else if(adminRegs[8].test(text)){

                        this.channels.displayAllChannels(message.channel);
                        return;

                    }else if(adminRegs[9].test(text)){

                        this.channels.setAutoChannel(message.channel, Discord);
                        return;

                    }else if(adminRegs[10].test(text)){

                        await this.channels.disableAutoChannel();
                        message.channel.send(`${config.passIcon} Auto query is now disabled.`);
                        return;
                    }
                }

                if(!await this.bBotEnabledInChannel(message.channel.id)){

                    if(config.bDisplayNotEnabled){
                        message.channel.send(`${config.failIcon} The bot is not enabled in this channel.`);
                    }
                    return;

                }

                if(serversReg.test(text)){

                    this.servers.displayAllServers(message.channel, false);

                }else if(activeReg.test(text)){
                
                    this.servers.displayAllServers(message.channel, true);

                }else if(shortQueryReg.test(text)){
                    
                    this.queryServerShort(text, message.channel);

                }else if(queryReg.test(text)){
                    
                    this.queryServer(text, message.channel);
                    
                }else if(ipQueryReg.test(text)){
                    
                    this.ipQueryReg(text, message.channel);

                }else if(helpReg.test(text)){

                    this.helpCommand(message.channel);

                }/*else if(text === '.test'){
                    console.log('test');

                    //	80.4.151.145:7777
                    this.query.getServerBasic('80.4.151.145', 7777, message.channel);
                    //this.query.getFullServer('208.79.234.80', 9000, message.channel);
                }else if(text == ".db"){

                    const test = await this.servers.getAllServers();

                    console.table(test);
                }*/
            }
        }catch(err){
            console.trace(err);
        }
    }

    bValidPort(input){

        input = parseInt(input);

        if(input === input)
            if(input > 0 && input <= 65535) return true;
            
        return false;
    }

    queryServer(message, channel){

        const reg = /^.q ((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+|)|((.+?)(:\d+|)))$/i;

        const result = reg.exec(message);

        if(result !== null){

            let port = 7777;
            let ip = '';

            if(result[2] !== undefined){

                ip = result[2];

                if(result[3] !== ''){

                    port = parseInt(result[3].replace(':',''));

                    if(!this.bValidPort(port)){

                        channel.send(`${config.failIcon} Port must be between 1 and 65535`);
                        return;
                    }
                }

                this.query.getFullServer(ip, port, channel);

            }else{

                ip = result[5];

                if(result[6] !== ''){
                    port = parseInt(result[6].replace(':',''));
                }

                if(this.bValidPort(port)){

                    this.query.getFullServer(ip, port, channel);

                }else{
                    channel.send(`${config.failIcon} Port must be between 1 and 65535`);
                    return;
                }
            }

        }else{
            channel.send(`${config.failIcon} Incorrect syntax for query server.`);
        }
    }

    async queryServerShort(message, channel){

        try{

            const reg = /^.q(\d+)$/i;

            const result = reg.exec(message);

            if(result !== null){

                const server = await this.servers.getServerById(result[1]); 
                
                if(server !== null){

                    this.query.getFullServer(server.ip, server.port, channel);

                }else{
                    channel.send(`${config.failIcon} A server with id **${result[1]}** does not exist.`);
                }

            }else{
                channel.send(`${config.failIcon} Incorrect syntax for short query server.`);
            }

        }catch(err){
            console.trace(err);
        }

    }


    bValidIp(input){

        return new Promise((resolve, reject) =>{

            const reg = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/i;

            if(reg.test(input)){

                resolve(true);

            }else{

                dns.lookup(input, (err) =>{

                    if(err){
                        console.trace(err);
                        resolve(false);
                    }

                    resolve(true);
                });
            }
        });
    }
    

    async editServer(message){    

        try{

            const reg = /.editserver (\d+) (.+?) (.+)/i;

            const result = reg.exec(message.content);

            if(result !== null){

                const editType = result[2].toLowerCase();

                if(config.validServerEditTypes.indexOf(editType) === -1){
                    message.channel.send(`${config.failIcon} **${result[2]}** is not a valid edit server type.`);
                    return;
                }

                let ip = -1;
                let port = -1;

                if(editType === 'ip'){

                    if(await this.bValidIp(result[3])){

                        ip = result[3];

                        console.log('valid ip/domain');

                    }else{
                        message.channel.send(`${config.failIcon} Not a valid IP/Domain.`);
                        return;
                    }

                }else if(editType === 'port'){

                    port = result[3];

                }else if(editType === 'country'){


                }


                const server = await this.servers.getServerById(result[1]);

                if(server !== null){

                    if(ip === -1){
                        ip = server.ip;
                    }

                    if(port === -1){
                        port = server.port;
                    }


                    if(editType === 'ip' || editType === 'port'){

                        if(!await this.servers.bServerAlreadyAdded(ip, port)){

                            await this.servers.edit(server, editType, result[3]);

                            message.channel.send(`${config.passIcon} Server **${result[1]}** **${editType.toUpperCase()}** has been changed to **${result[3]}**, previously was **${server[editType]}**.`);
                        
                        }else{

                            message.channel.send(`${config.failIcon} Failed to update Server **${result[1]}** IP:PORT combination already exists.`);
                        }

                    }else{

                        await this.servers.edit(server, editType, result[3]);

                        message.channel.send(`${config.passIcon} Server **${result[1]}** **${editType.toUpperCase()}** has been changed to **${result[3]}**, previously was **${server[editType]}**.`);
                        
                    }

                }else{
                    message.channel.send(`${config.failIcon} A server with the id **${result[1]}** does not exist.`);
                }

            }else{
                message.channel.send(`${config.failIcon} Incorrect edit server syntax.`);
            }

        }catch(err){
            console.trace(err);
        }
    }

    async ipQueryReg(text, channel){

        try{

            const reg = /^.ip(\d+)$/i;

            const result = reg.exec(text);

            if(result !== null){

                //console.log(result);

                const server = await this.servers.getServerById(result[1]);

                if(server !== null){

                    let string = `:desktop: **${server.name}**\n`;
                    string += `:wrestling: Join as Player **<ut2004://${server.ip}:${server.port}>**\n`;
                    string += `:eyes: Join as Spectator **<ut2004://${server.ip}:${server.port}?spectatorOnly=1>**\n`;

                    channel.send(string);
                    
                }else{
                    channel.send(`${config.failIcon} There is no server with the id **${result[1]}**.`);
                }

            }else{

                channel.send(`${config.failIcon} Incorrect ${config.commandPrefix}ip command syntax.`);
            }

        }catch(err){
            console.trace(err);
        }
    }

    helpCommand(channel){

        const adminCommands = [
            {"command": "addserver alias ip:port", "text": "Add a server to the database with the specified alias ip and port, if port is not specified 7777 is used."},
            {"command": "deleteserver serverID", "text": "Deletes the specified server matching the IP:PORT of the ID."},
            {"command": "editserver serverID type value", "text": "Edits the specified server's type with the new value, valid types are **IP, Port, Alias**."},
            {"command": "roles", "text": "Displays all user roles that can use admin commands."},
            {"command": "allowrole Name", "text": "Allows users with said role to use admin commands."},
            {"command": "removerole Name", "text": "Disables users with said role from using admin commands."},
            {"command": "allowchannel", "text": "Allows the bot to be used in the current channel."},
            {"command": "removechannel", "text": "Disables the bot to be used in the current channel."},
            {"command": "channels", "text": "Displays all channels that are enabled for bot usage."}
        ];

        const normalCommands = [
            {"command": "help", "text": "Displays this command."},
            {"command": "servers", "text": "Displays all the servers added to the database."},
            {"command": "active", "text": "Displays all the servers added to the database that has at least 1 player in it."},
            {"command": "qID", "text": "Queries the specified server ip:port matching that server ID in the database."},
            {"command": "q ip:port", "text": "Queries a UT2004 server with the specified ip:port, if port is not provided 7777 is used."},
            {"command": "ipID", "text": "Displays the name and ip:port of the server added to the database."}
        ];

        let adminString = `:robot:** UT2004 Server Query Discord Bot :robot:**\n:cop:**Admin Commands**\n`;

        for(let i = 0; i < adminCommands.length; i++){

            adminString += `**${config.commandPrefix}${adminCommands[i].command}** ${adminCommands[i].text}\n`;
        }


        channel.send(adminString);

        let normalString = `\n:adult:**User Commands**\n`;

        for(let i = 0; i < normalCommands.length; i++){

            normalString += `**${config.commandPrefix}${normalCommands[i].command}** ${normalCommands[i].text}\n`;
        }


        normalString += `:keyboard: **Github Repo** <https://github.com/scottadkin/Discord-UT2004-Server-Query>\n`;
        normalString += `**UT2004 URL Registry Fix** <https://github.com/serverlinkdev/shoNuff>`;

        channel.send(normalString);
    }


    async addRole(message){

        try{

            const reg = /^.allowrole (.+)$/i;

            const result = reg.exec(message.content);

            if(result !== null){

                if(this.roles.bRoleExists(result[1], message)){

                    const roleId = this.roles.getRoleId(result[1], message.channel);

                    if(roleId !== null){

                        await this.roles.addRole(roleId, result[1], message.channel);
                        
                    }else{

                        console.log('Fart noise');
                    }

                }else{
                    message.channel.send(`${config.failIcon} There is no role called **${result[1]}** on this Discord server.`);
                }

            }else{
                message.channel.send(`${config.failIcon} Incorrect syntax for add role.`);
            }

        }catch(err){
            console.trace(err);
        }
    }

    async deleteRole(message){

        try{

            const reg = /^.removerole (.+)$/i;

            const result = reg.exec(message.content);

            if(result !== null){

                const roleId = this.roles.getRoleId(result[1], message.channel);

                if(roleId !== null){

                    await this.roles.deleteRole(roleId);

                    message.channel.send(`${config.passIcon} Users with role **${result[1]}** can no longer use admin commands.`);

                }else{
                    message.channel.send(`${config.failIcon} There is no role called **${result[1]}** on this Discord server.`);
                }

            }else{
                message.channel.send(`${config.failIcon} Incorrect delete role syntax.`);
            }

        }catch(err){
            console.trace(err);
        }
    }

}


module.exports = Bot;