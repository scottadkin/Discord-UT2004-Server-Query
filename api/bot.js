import { discordToken, defaultAdminRole, commandPrefix, failIcon, passIcon, bDisplayNotEnabled, validServerEditTypes } from "../config.js";
import UT2k4Query from "./ut2k4query.js";
import {Client, Events, GatewayIntentBits, Options} from "discord.js";
import Servers from "./servers.js";
import dns from "dns";
import Roles from "./roles.js";
import Channels from "./channels.js";

export default class Bot{

    constructor(){

        this.servers = new Servers();
        this.roles = new Roles();
        this.channels = new Channels(this.servers);

        this.bDisabled = false;

        this.adminRegs = {
            "addServer": /^.addserver .+$/i,
            "deleteServer": /^.deleteserver \d+$/i,
            "editServer": /^.editserver \d+ .+? .+?$/i,
            "allowRole": /^.allowrole .+$/i,
            "removeRole": /^.removerole .+$/i,
            "roles": /^.roles$/i,
            "allowChannel": /^.allowchannel$/i,
            "removeChannel": /^.removechannel$/i,
            "channels": /^.channels$/i,
            "setAuto": /^.setauto$/i,
            "disableAuto": /^.disableauto$/i
        };

        this.createClient();
    }

    createClient(){

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ],
            makeCache: Options.cacheWithLimits(Options.DefaultMakeCacheSettings)
        });

        this.client.once(Events.ClientReady, (readyClient) =>{
            this.query = new UT2k4Query(this.client, this.servers, this.channels);

        });

    
        this.client.on('error', (err) =>{
            console.trace(err);
        });
        
        this.client.on('messageCreate', (message) =>{
            this.parseCommand(message);
        });

        this.client.login(discordToken);
    }

    disconnect(){

        console.log('disconnect');
        this.bDisabled = true;
        this.client.destroy();
    }


    bUserAdmin(message){

        try{

            const user = message.member;

            const userRoles = user.roles.cache;

            const bDefaultAdmin = (elem) =>{

                if(elem.name.toLowerCase() === defaultAdminRole.toLowerCase()) return true;
                return false;
            }

            if(userRoles.some(bDefaultAdmin)){
               // console.log(`User is default admin role`);
                return true;
            }

            const addedRolesFull = this.roles.getAllAddedRoles();

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

            const channels = this.channels.getAllChannels(true);

            if(channels.indexOf(channelId) !== -1){
                return true;
            }

            return false;

        }catch(err){
            console.trace(err);
        }
    }

    parseAdminCommand(message){

        const regs = this.adminRegs;
        const text = message.content;

        if(regs.addServer.test(text)){

            this.servers.addServer(message);
            return;

        }else if(regs.deleteServer.test(text)){

            this.servers.deleteServer(message);
            return;

        }else if(regs.editServer.test(text)){
            
            this.editServer(message);
            return;

        }else if(regs.allowRole.test(text)){
            
            this.addRole(message);
            return;

        }else if(regs.removeRole.test(text)){

            this.deleteRole(message);
            return;

        }else if(regs.roles.test(text)){

            this.roles.displayAddedRoles(message.channel);
            return;

        }else if(regs.allowChannel.test(text)){

            this.channels.addChannel(message.channel);
            return;

        }else if(regs.removeChannel.test(text)){

            this.channels.removeChannel(message.channel);
            return;

        }else if(regs.channels.test(text)){

            this.channels.displayAllChannels(this.client, message.channel, message.guild);
            return;

        }else if(regs.setAuto.test(text)){

            this.channels.setAutoChannel(message.channel);
            return;

        }else if(regs.disableAuto.test(text)){

            this.channels.disableAutoChannel();
            message.channel.send(`${passIcon} Auto query is now disabled.`);
            return;
        }    
    }

    bTryingToUseAdminCommand(text){

        for(const reg of Object.values(this.adminRegs)){

            if(reg.test(text)) return true;
        }

        return false;
    }

    parseCommand(message){

        try{

            const text = message.content;

            if(text.length <= 1) return;
            if(!text.startsWith(commandPrefix)) return;

            if(text[1] === commandPrefix) return; //ignore to prevent false positives

            const serversReg = /^.servers$/i;
            const activeReg = /^.active$/i;
            const queryReg = /^.q .+$/i;
            const shortQueryReg = /^.q\d+$/i;
            const ipQueryReg = /^.ip\d+$/i;
            const helpReg = /^.help$/i;

            const bAdmin = this.bUserAdmin(message);
            const bAdminOnlyCommand = this.bTryingToUseAdminCommand(text);

            if(!bAdmin && bAdminOnlyCommand){

                message.channel.send(`${failIcon} You do not have permission to use this command.`);
                return;
            }

            if(bAdmin && bAdminOnlyCommand){
                return this.parseAdminCommand(message);
            }

            if(!this.bBotEnabledInChannel(message.channel.id)){

                if(bDisplayNotEnabled){
                    message.channel.send(`${failIcon} The bot is not enabled in this channel.`);
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

            }
            
        }catch(err){
            console.trace(err);
        }
    }

    bValidPort(input){

        input = parseInt(input);

        if(input !== input) return false;

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

                        channel.send(`${failIcon} Port must be between 1 and 65535`);
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
                    channel.send(`${failIcon} Port must be between 1 and 65535`);
                    return;
                }
            }

        }else{
            channel.send(`${failIcon} Incorrect syntax for query server.`);
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
                    channel.send(`${failIcon} A server with id **${result[1]}** does not exist.`);
                }

            }else{
                channel.send(`${failIcon} Incorrect syntax for short query server.`);
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

            if(result === null){
                message.channel.send(`${failIcon} Incorrect edit server syntax.`);
                return;
            }

            const editType = result[2].toLowerCase();

            if(validServerEditTypes.indexOf(editType) === -1){
                message.channel.send(`${failIcon} **${result[2]}** is not a valid edit server type.`);
                return;
            }

            let ip = -1;
            let port = -1;

            if(editType === 'ip'){

                if(await this.bValidIp(result[3])){

                    ip = result[3];

                }else{
                    message.channel.send(`${failIcon} Not a valid IP/Domain.`);
                    return;
                }

            }else if(editType === 'port'){

                port = result[3];

            }else if(editType === 'country'){


            }


            const server = this.servers.getServerById(result[1]);

            if(server !== null){

                if(ip === -1){
                    ip = server.ip;
                }

                if(port === -1){
                    port = server.port;
                }


                if(editType === 'ip' || editType === 'port'){

                    if(!this.servers.bServerAlreadyAdded(ip, port)){

                        this.servers.edit(server, editType, result[3]);

                        message.channel.send(`${passIcon} Server **${result[1]}** **${editType.toUpperCase()}** has been changed to **${result[3]}**, previously was **${server[editType]}**.`);
                    
                    }else{

                        message.channel.send(`${failIcon} Failed to update Server **${result[1]}** IP:PORT combination already exists.`);
                    }

                }else{

                    this.servers.edit(server, editType, result[3]);

                    message.channel.send(`${passIcon} Server **${result[1]}** **${editType.toUpperCase()}** has been changed to **${result[3]}**, previously was **${server[editType]}**.`);
                    
                }

            }else{
                message.channel.send(`${failIcon} A server with the id **${result[1]}** does not exist.`);
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

                const server = this.servers.getServerById(result[1]);

                if(server !== null){

                    let string = `:desktop: **${server.name}**\n`;
                    string += `:wrestling: Join as Player **<ut2004://${server.ip}:${server.port}>**\n`;
                    string += `:eyes: Join as Spectator **<ut2004://${server.ip}:${server.port}?spectatorOnly=1>**\n`;

                    channel.send(string);
                    
                }else{
                    channel.send(`${failIcon} There is no server with the id **${result[1]}**.`);
                }

            }else{

                channel.send(`${failIcon} Incorrect ${commandPrefix}ip command syntax.`);
            }

        }catch(err){
            console.trace(err);
        }
    }

    async helpCommand(channel){

        const adminCommands = [
            {"command": "addserver alias ip:port", "text": "Add a server to the database with the specified alias ip and port, if port is not specified 7777 is used."},
            {"command": "deleteserver serverID", "text": "Deletes the specified server matching the IP:PORT of the ID."},
            {"command": "editserver serverID type value", "text": "Edits the specified server's type with the new value, valid types are **IP, Port, Alias**."},
            {"command": "roles", "text": "Displays all user roles that can use admin commands."},
            {"command": "allowrole Name", "text": "Allows users with said role to use admin commands."},
            {"command": "removerole Name", "text": "Disables users with said role from using admin commands."},
            {"command": "allowchannel", "text": "Allows the bot to be used in the current channel."},
            {"command": "removechannel", "text": "Disables the bot to be used in the current channel."},
            {"command": "channels", "text": "Displays all channels that are enabled for bot usage."},
            {"command": "setauto", "text": "Sets the current channel as the auto query update channel, the server info posts created will be updated in intervals."},
            {"command": "disableauto", "text": "Disables auto query channel updates."},
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

            adminString += `**${commandPrefix}${adminCommands[i].command}** ${adminCommands[i].text}\n`;
        }


        await channel.send(adminString);

        let normalString = `\n:adult:**User Commands**\n`;

        for(let i = 0; i < normalCommands.length; i++){

            normalString += `**${commandPrefix}${normalCommands[i].command}** ${normalCommands[i].text}\n`;
        }


        normalString += `:keyboard: **Github Repo** <https://github.com/scottadkin/Discord-UT2004-Server-Query>\n`;
        normalString += `**OldUnreal UT2004 Full Game Installer** <https://www.oldunreal.com/downloads/ut2004/full-game-installers/>\n`;
        normalString += `**OldUnreal UT2004 Patches** <https://github.com/OldUnreal/UT2004Patches/releases>`;

        await channel.send(normalString);
    }


    async addRole(message){

        try{

            const reg = /^.allowrole (.+)$/i;

            const result = reg.exec(message.content);

            if(result !== null){

                if(this.roles.bRoleExists(result[1], message)){

                    const roleId = await this.roles.getRoleId(result[1], message.guild);

                    if(roleId !== null){

                        this.roles.addRole(roleId, result[1], message.channel);
                        
                    }

                }else{
                    message.channel.send(`${failIcon} There is no role called **${result[1]}** on this Discord server.`);
                }

            }else{
                message.channel.send(`${failIcon} Incorrect syntax for add role.`);
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

                const roleId = this.roles.getRoleId(result[1], message.guild);

                if(roleId !== null){

                    await this.roles.deleteRole(roleId);

                    message.channel.send(`${passIcon} Users with role **${result[1]}** can no longer use admin commands.`);

                }else{
                    message.channel.send(`${failIcon} There is no role called **${result[1]}** on this Discord server.`);
                }

            }else{
                message.channel.send(`${failIcon} Incorrect delete role syntax.`);
            }

        }catch(err){
            console.trace(err);
        }
    }
}