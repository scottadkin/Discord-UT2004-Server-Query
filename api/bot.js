import { 
    discordToken, defaultAdminRole, commandPrefix, failIcon, 
    passIcon, bDisplayNotEnabled, validServerEditTypes, 
    embedColor, bDisplayBotGithubLink, bDisplayOldUnrealLinks } from "../config.js";
import UT2k4Query from "./ut2k4query.js";
import {Client, Events, GatewayIntentBits, hyperlink, Options} from "discord.js";
import Servers from "./servers.js";
import Roles from "./roles.js";
import Channels from "./channels.js";
import { bValidAddress, bValidPort, getFlagString } from "./generic.js";

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

            try{
                this.parseCommand(message);
            }catch(err){
                console.trace(err);
            }
        });

        this.client.login(discordToken);
    }

    disconnect(){

        console.log('disconnect');
        this.bDisabled = true;
        this.client.destroy();
    }


    bUserAdmin(message){

        const userRoles = message.member.roles.cache;

        const userRoleIds = [...userRoles.keys()];

        const bDefaultAdmin = (elem) =>{

            if(elem.name.toLowerCase() === defaultAdminRole.toLowerCase()){
                return true;
            }

            return false;
        }

        if(userRoles.some(bDefaultAdmin)){
            return true;
        }

        const addedRolesFull = this.roles.getAllAddedRoles();

        const addedRoles = addedRolesFull.map((elem) =>{
            return elem.id;
        });


        for(let i = 0; i < userRoleIds.length; i++){

            const id = userRoleIds[i];

            if(addedRoles.indexOf(id) !== -1){
                return true;
            }
        }

        return false;
    }


    bBotEnabledInChannel(channelId){


        const channels = this.channels.getAllChannels(true);

        const index = channels.indexOf(channelId);

        return index !== -1;

    }

    async parseAdminCommand(message){

        const regs = this.adminRegs;
        const text = message.content;

        if(regs.addServer.test(text)){

            return this.servers.addServer(message);

        }else if(regs.deleteServer.test(text)){

            return this.servers.deleteServer(message);
            

        }else if(regs.editServer.test(text)){
            
            return this.editServer(message);

        }else if(regs.allowRole.test(text)){
            
            return this.addRole(message);
            
        }else if(regs.removeRole.test(text)){

            return this.deleteRole(message);

        }else if(regs.roles.test(text)){

            return this.roles.displayAddedRoles(message.channel);

        }else if(regs.allowChannel.test(text)){

            return this.channels.addChannel(message.channel);

        }else if(regs.removeChannel.test(text)){

            return this.channels.removeChannel(message.channel);      

        }else if(regs.channels.test(text)){

            return this.channels.displayAllChannels(this.client, message.channel, message.guild);
            

        }else if(regs.setAuto.test(text)){

            return this.channels.setAutoChannel(message.channel);
            

        }else if(regs.disableAuto.test(text)){

            this.channels.disableAutoChannel();
            return message.channel.send(`${passIcon} Auto query is now disabled.`);
            
        }
    }

    bTryingToUseAdminCommand(text){

        for(const reg of Object.values(this.adminRegs)){

            if(reg.test(text)) return true;
        }

        return false;
    }

    async parseCommand(message){

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

                return message.channel.send(`${failIcon} You do not have permission to use this command.`);
            }

            if(bAdmin && bAdminOnlyCommand){
                return this.parseAdminCommand(message);
            }

            if(!this.bBotEnabledInChannel(message.channel.id)){

                if(bDisplayNotEnabled){
                    return message.channel.send(`${failIcon} The bot is not enabled in this channel.`);
                }
                
                return
            }   

            if(serversReg.test(text)){

                return this.servers.displayAllServers(message.channel, false);

            }else if(activeReg.test(text)){
            
                return this.servers.displayAllServers(message.channel, true);

            }else if(shortQueryReg.test(text)){
                
                return this.queryServerShort(text, message.channel);

            }else if(queryReg.test(text)){
                
                return this.queryServer(text, message.channel);
                
            }else if(ipQueryReg.test(text)){
                
                return this.ipQueryReg(text, message.channel);

            }else if(helpReg.test(text)){

                return this.helpCommand(message.channel, bAdmin);
            }

        }catch(err){
            console.log(err);
        }
       
     
    }

    queryServer(message, channel){

        const reg = /^.q ((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+|)|((.+?)(:\d+|)))$/i;

        const result = reg.exec(message);

        if(result === null){
            return channel.send(`${failIcon} Incorrect syntax for query server.`);
        }

        let port = 7777;
        let ip = '';

        if(result[2] !== undefined){

            ip = result[2];

            if(result[3] !== ''){

                port = parseInt(result[3].replace(':',''));

                if(!bValidPort(port)){

                    return channel.send(`${failIcon} Port must be between 1 and 65535`);
                    
                }
            }

            this.query.getFullServer(ip, port, channel);

        }else{

            ip = result[5];

            if(result[6] !== ''){
                port = parseInt(result[6].replace(':',''));
            }

            if(bValidPort(port)){

                this.query.getFullServer(ip, port, channel);

            }else{
                return channel.send(`${failIcon} Port must be between 1 and 65535`);
                
            }
        }

       
    }

    async queryServerShort(message, channel){

        const reg = /^.q(\d+)$/i;

        const result = reg.exec(message);

        if(result === null){
            return channel.send(`${failIcon} Incorrect syntax for short query server.`);
        }

        const server = this.servers.getServerById(result[1]); 

        if(server === null){
            return channel.send(`${failIcon} A server with id **${result[1]}** does not exist.`);
        }    

        this.query.getFullServer(server.ip, server.port, channel);
    }

    createUpdateString(serverId, editType, newValue, oldValue){

        let string = `${passIcon} Server **${serverId}** **${editType.toUpperCase()}** `;
        string += `has been changed to **${newValue}**, previously was **${oldValue}**.`

        return string
    }

    async editServer(message){    

        const reg = /.editserver (\d+) (.+?) (.+)/i;

        const result = reg.exec(message.content);

        if(result === null){
            return message.channel.send(`${failIcon} Incorrect edit server syntax.`);   
        }

        const editType = result[2].toLowerCase();

        if(validServerEditTypes.indexOf(editType) === -1){
            return message.channel.send(`${failIcon} **${result[2]}** is not a valid edit server type.`);    
        }

        let ip = -1;
        let port = -1;
        let country = "";

        if(editType === 'ip'){

            if(await bValidAddress(result[3])){

                ip = result[3];

            }else{
                return message.channel.send(`${failIcon} Not a valid IP/Domain.`);        
            }

        }else if(editType === 'port'){

            port = result[3];

            if(!bValidPort(port)){
                return message.channel.send(`${failIcon} Not a valid Port.`);  
            }

        }else if(editType === 'country'){

            country = result[3].toLowerCase();

            if(country.length !== 2){

                let text = `${failIcon} The country code must be in ISO 3166-1 alpha-2 format.\n`;
                text +=  `You can find the flag codes in the flags emote category,`;
                text += ` or you can use this wiki article: <https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2>.`;

                return message.channel.send(text);  
            }
        }

        const server = this.servers.getServerById(result[1]);

        if(server === null){

            return message.channel.send(`${failIcon} A server with the id **${result[1]}** does not exist.`);  
        }

        if(ip === -1){
            ip = server.ip;
        }

        if(port === -1){
            port = server.port;
        }

        if(country === "") country = server.country;

        let passString = this.createUpdateString(result[1], editType, result[3], server[editType]);


        if(editType === 'ip' || editType === 'port'){


            if(!this.servers.bServerAlreadyAdded(ip, port)){

                this.servers.edit(server, editType, result[3]);
                
                return message.channel.send(passString);
       
            }

            return message.channel.send(`${failIcon} Failed to update Server **${result[1]}** IP:PORT combination already exists.`);
            
        }

        this.servers.edit(server, editType, result[3]);

        return message.channel.send(passString);     
    }

    async ipQueryReg(text, channel){

        const reg = /^.ip(\d+)$/i;

        const result = reg.exec(text);

        if(result !== null){

            const server = this.servers.getServerById(result[1]);

            if(server === null){

                return channel.send(`${failIcon} There is no server with the id **${result[1]}**.`);
            }

            const flagString = getFlagString(server.country);

            const normalEmbed = {
                "color": embedColor,
                "title": `${flagString}${server.name}`,
                "description": `${server.ip}:${server.port}`
            
            };
            
            channel.send({"embeds": [normalEmbed]});
          

        }else{
            channel.send(`${failIcon} Incorrect ${commandPrefix}ip command syntax.`);
        }
    }

    async helpCommand(channel, bAdmin){

        const adminCommands = [
            {"command": "addserver alias ip:port", "text": "Add a server to the database with the specified alias ip and port, if port is not specified 7777 is used."},
            {"command": "deleteserver serverID", "text": "Deletes the specified server matching the IP:PORT of the ID."},
            {"command": "editserver serverID type value", "text": "Edits the specified server's type with the new value, valid types are **IP, Port, Alias, Country**."},
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

        const adminFields = [];

        if(bAdmin){

            for(let i = 0; i < adminCommands.length; i++){

                const {command, text} = adminCommands[i];
                
                adminFields.push({
                    "name": `__${commandPrefix}${command}__`,
                    "value": text,
                    "inline": false,
                });
            }

            const adminEmbed = {
                "color": embedColor,
                "title": 'Admin Commands',
                "fields": [
                    ...adminFields
                ]
            };
            await channel.send({ "embeds": [adminEmbed] });
        }


        const normalFields = [];

        for(let i = 0; i < normalCommands.length; i++){

            const {command, text} = normalCommands[i];
                
            normalFields.push({
                "name": `__${commandPrefix}${command}__`,
                "value": text,
                "inline": false,
            });
        }

        if(bDisplayOldUnrealLinks){
            normalFields.push({"name": `:free: OldUnreal UT2004 Full Game Installer`, "value": `<https://www.oldunreal.com/downloads/ut2004/full-game-installers/>`});
            normalFields.push({"name": `:large_blue_diamond: OldUnreal UT2004 Patches`, "value": `<https://github.com/OldUnreal/UT2004Patches/releases>`});
        }

        if(bDisplayBotGithubLink){
            normalFields.push({"name": `:keyboard: Bot Github Repo`, "value": `<https://github.com/scottadkin/Discord-UT2004-Server-Query>`});
        }

        const normalEmbed = {
            "color": embedColor,
            "title": 'User Commands',
            "fields": [
                ...normalFields
            ]
        };

        await channel.send({ "embeds": [normalEmbed] });

    }


    addRole(message){

        const reg = /^.allowrole (.+)$/i;

        const result = reg.exec(message.content);

        if(result === null){
            return message.channel.send(`${failIcon} Incorrect syntax for add role.`);
        }

        if(this.roles.bRoleExists(result[1], message)){

            const roleId = this.roles.getRoleId(result[1], message.guild);

            if(roleId !== null){
                this.roles.addRole(roleId, result[1], message.channel);     
            }

        }else{
            return message.channel.send(`${failIcon} There are no roles called **${result[1]}** on this Discord server.`);
        }     
    }

    deleteRole(message){


        const reg = /^.removerole (.+)$/i;

        const result = reg.exec(message.content);

        if(result === null){
            return message.channel.send(`${failIcon} Incorrect delete role syntax.`);
        }

        const roleId = this.roles.getRoleId(result[1], message.guild);

        if(roleId === null){
            return message.channel.send(`${failIcon} There are no roles called **${result[1]}** on this Discord server.`);
        }

        this.roles.deleteRole(roleId);

        return message.channel.send(`${passIcon} Users with role **${result[1]}** can no longer use admin commands.`);

    }
}