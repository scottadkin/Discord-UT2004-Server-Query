const Promise = require('promise');
const Discord = require('discord.js');
const UT2004Query = require('./ut2004q');
const Servers = require('./servers');
const config = require('./config');
const db = require('./database');

class Bot{

    constructor(){

        this.createClient();
        this.servers = new Servers(db);
        this.query = new UT2004Query(db);

        
    }


    bAdminRole(adminRoles, role){

        for(let i = 0; i < adminRoles.length; i++){

            if(adminRoles[i].name.toLowerCase() == role.toLowerCase()){
                return true;
            }
        }

        return false;
    }

    bUserAdmin(message, adminRoles){

        try{
            
            const member = message.member;

            let result = false;

            member.roles.cache.some((role) =>{

                if(role.name.toLowerCase() == config.adminRole.toLowerCase()){
                    result = true;
                    return
                }else if(this.bAdminRole(adminRoles, role.name)){
                    console.log("user has added role");
                    result = true;
                    return
                }
            });

            return result;

        }catch(err){
            console.trace(err);
        }
    }

    getAllowedChannels(){

        return new Promise((resolve, reject) =>{

            const query = "SELECT * FROM channels";

            const data = [];

            db.each(query, (err, row) =>{

                if(err) reject(err);

                data.push(row);

            }, (err) =>{

                if(err) reject(err);

                resolve(data);
            });
        });
    }

    canBotPostInChannel(message, bAdmin){

        return new Promise((resolve, reject) =>{

            if(bAdmin){
                resolve(true);
            }

            this.getAllowedChannels().then((channels) =>{

                console.table(channels);

                let c = 0;

                const currentChannel = message.channel.name.toLowerCase();

                for(let i = 0; i < channels.length; i++){

                    c = channels[i];

                    if(c.name == currentChannel){
                        resolve(true);
                    }

                }

                resolve(false);

            }).catch(() =>{
                reject(err);
            });
        });
       


    }

    //DELETE LAST PENDING MESSAGE FRO SAME SERVER QUERY FOR EACH NEW QUERY

    forceStringLength(string, targetLength){

        if(string.length > targetLength){

           string = string.slice(0, targetLength);

        }else{

            while(string.length < targetLength){
                string += " ";
            }
        }

        return string;
    }

    createServerString(id, data){

        id = parseInt(id + 1);

        if(id != id){

            id = "ID";

        }else{

            if(id < 10){
                id = id+" ";
            }

        }

        let string = "";

        const idLength = 4;
        const aliasLength = 25;
        const mapLength = 25;
        const playersLength = 7;
        

        data.alias = this.forceStringLength(data.alias, aliasLength);
        data.map = this.forceStringLength(data.map, mapLength);

        data.current_players = parseInt(data.current_players);
        data.max_players = parseInt(data.max_players);

        let playersString = `${data.current_players}/${data.max_players}`;

        if(data.current_players != data.current_players){
            playersString = "Players";
        }

        playersString = this.forceStringLength(playersString, playersLength);

        const now = Math.floor(Date.now() * 0.001);

        if(now - data.modified > (config.serverTimeout + config.serverPingInterval) * 2){

            data.map = this.forceStringLength("Timed Out!", mapLength);
            playersString = this.forceStringLength("N/A", playersLength);
        }

        
        string = `\`${id} - ${data.alias} ${data.map} ${playersString}\`\n`;

        return string;
    }

    async listServers(message){

        
        try{
            const servers = await this.servers.getAllServers();

            let serverString = "";

            let s = "";

            for(let i = 0; i < servers.length; i++){

                serverString += this.createServerString(i, servers[i]);
        
            }

            if(serverString == ""){
                serverString = "**There are currently no servers added.**";
            }

            let embed = new Discord.MessageEmbed()
            .setColor("#000000")
            .setTitle("Unreal Tournament 2004 Servers")
            .setDescription("Use `.q serverid` for more information on a server.")
            .addField(this.createServerString("ID", {"alias": "Server Alias", "map": "Map", "current_players": "Play", "max_players": "ers"}), serverString);


            message.channel.send(embed);

        }catch(err){
            console.trace(err);
        }
    }


    getAllServers(){

        return new Promise((resolve, reject) =>{

            const servers = [];

            const query = "SELECT * FROM servers ORDER BY added ASC";

            db.each(query, (err, row) =>{

                if(err) reject("There was a problem getting servers from database.");

                servers.push(row);

            }, (err, totalRows) =>{

                if(err) reject("There was a problem getting servers from database(ALT)");

                resolve(servers);
            });

        });
    }

    async removeServer(message){

        try{

            const reg = /^\.deleteserver (\d+)$/i;

            const result = reg.exec(message.content);

            //console.log(result);

            if(result !== null){

                const id = parseInt(result[1]) - 1;

                const servers = await this.servers.getAllServers();

                if(servers.length < id){
                    message.channel.send("Can't delete server with that id, it does not exist!");
                    return;
                }

                //console.table(servers);

                await this.servers.deleteServer(servers[id].ip, servers[id].port);

                message.channel.send("Server deleted!");
                //this.listServers(message);

            }else{

                message.channel.send("Invalid syntax, correct is `.deleteserver serverid`");
            
            }

        }catch(err){
            message.channel.send("There is no server with that id to delete.");
            console.trace(err);
        }

    }

    async addServer(message){

        try{
            const reg = /^.addserver (.+) (.+?)(:{0,1})(\d{0,5})$/i;

            const result = reg.exec(message.content);

            let ip = '';
            let port = 0;

            if(result != null){

               // console.log(result);

                //port not specified set it to 7777
                if(result[3] === ":"){
                    port = parseInt(result[4]);
                    ip = result[2];
                }else{
                    ip = result[2] + result[4];
                    port = 7777;
                }

                const test = await this.servers.bServerAlreadyAdded(ip, port);

                if(test.total_servers > 0){
                    //console.log("Server already added");
                    message.channel.send("That server has already been added to the database.");
                }else{
                   // console.log("I can add that");

                    const finalIp = await this.servers.getIp(ip);

                    await this.servers.insertServer(ip, finalIp, port, result[1]);
                    message.channel.send("Server successfully added.");
                    //this.listServers(message);
                }

                //console.log("test = ");
               // console.log(test);
               // console.log(`Addserver ${ip}:${port}`);
            }else{
                message.channel.send("Incorrect Syntax! Correct is `.addserver alias ip:port`");
                console.log("result is null");
            }
        }catch(err){
            console.trace(err);

            message.channel.send("There was a database error, failed to added server.");
        }
    }

    bChannelExist(id){

        return new Promise((resolve, reject) =>{

            const query = "SELECT COUNT(*) as total_channels FROM channels WHERE channel_id=?";

            db.get(query, [id], (err, row) =>{

                if(err) reject(err);

                if(row.total_channels > 0){
                    resolve(true);
                }

                resolve(false);
            
            });
        });
    }

    insertChannel(channel){

        return new Promise((resolve, reject) =>{

            const query = "INSERT INTO channels VALUES(?,?)";

            db.run(query, [channel.id, channel.name], (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    async allowChannel(message){


        try{

            const bAlreadyExists = await this.bChannelExist(message.channel.id);

            //console.log("exists = "+bAlreadyExists);
            //console.log(message.channel);

            if(!bAlreadyExists){

                await this.insertChannel(message.channel);

                message.channel.send("Bot can now be used in this channel.");

            }else{
                message.channel.send("This channel has already been enabled for bot use.");
            }

        }catch(err){
            console.trace(err);
        }
    }

    deleteChannel(channel){

        return new Promise((resolve, reject) =>{

            const query = "DELETE FROM channels WHERE channel_id=?";

            db.run(query, [channel.id], (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    async removeChannel(message){

        try{

            const bAlreadyExists = await this.bChannelExist(message.channel.id);

            console.log("bAlreadyExists = "+bAlreadyExists);
            if(bAlreadyExists){

                await this.deleteChannel(message.channel);

                message.channel.send("Bot is no longer enabled in this channel.");

            }else{
                message.channel.send("Bot was already disabled for this channel.");
            }

        }catch(err){
            console.trace(err);
        }
    }

    bRoleAlreadyExists(role){

        console.log(`Looking for role ${role}`);

        role = role.toLowerCase();

        return new Promise((resolve, reject) =>{

            const query = "SELECT COUNT(*) as total_roles FROM roles WHERE name=?";

            db.get(query, [role], (err, row) =>{

                if(err) reject(err);

               // console.log(row);

                if(row.total_roles > 0){
                    resolve(true);
                }

                resolve(false);
            });
        });
    }

    insertRole(id, name){

        name = name.toLowerCase();

        return new Promise((resolve, reject) =>{

            const now = Math.floor(Date.now() * 0.001);

            const query = "INSERT INTO roles VALUES(?,?,?)";

            db.run(query, [id, name, now], (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    getAllAdminRoles(){

        return new Promise((resolve, reject) =>{

            const roles = [];

            const query = "SELECT * FROM roles";

            db.each(query, (err, row) =>{

                if(err) reject(err);

                roles.push(row);

            }, (err, totalRows) =>{

                if(err) reject(err);

                resolve(roles);
            });
        });
    }

    getAllRoles(message){

        const roles = message.channel.guild.roles.cache;

        const result = [];

        roles.forEach((role) =>{

            result.push(role);
        });

        return result;
    }

    getRole(message, roleName){

        roleName = roleName.toLowerCase();
        const roles = message.channel.guild.roles.cache;

        let result = null;

        roles.forEach((role) =>{

            //console.log(role.name);
            if(role.name.toLowerCase() == roleName){
                result = role;
            }

        });

        return result;
    }

    bValidRole(message, roleName){

        const result = this.getRole(message, roleName);

        if(result === null){
            return false;
        }

        return true;
    }

    async allowRole(message){

        try{

            const allowRoleReg = /^.allowrole (.+)$/i;

            const result = allowRoleReg.exec(message.content);
            

            if(this.bValidRole(message, result[1])){

                const role = this.getRole(message, result[1]);
           // message.channel.guild.roles.cache.forEach(a => console.log(a));

                const bAlreadyExists = await this.bRoleAlreadyExists(result[1]);
            

                if(bAlreadyExists){
                    message.channel.send(`The role **${result[1]}** already has bot admin privileges.`);
                }else{
                    //this.insertRole(message);
                    await this.insertRole(role.id, role.name);

                    message.channel.send(`The role **${result[1]}** now has bot admin privileges.`);
                }
            }else{
                message.channel.send(`There are no roles called **${result[1]}** on this Discord server.`);
            }

        }catch(err){
            console.trace(err);
        }
    }

    deleteRole(role){

        role = role.toLowerCase();

        return new Promise((resolve, reject) =>{

            const query = "DELETE FROM roles WHERE name=?";

            db.run(query, [role], (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    async removeRole(message){

        try{
            const reg = /^.deleterole (.+)$/i;

            const result = reg.exec(message.content);

            if(result != null){

                const bExists = await this.bRoleAlreadyExists(result[1]);

               // console.log(this.bRoleAlreadyExists(result[1]));
                if(bExists){
                    await this.deleteRole(result[1]);
                    message.channel.send(`The role **${result[1]}** no longer has admin privileges.`);
                }else{
                    message.channel.send(`The role **${result[1]}** did not have admin privileges already.`);
                }

            }else{
                message.channel.send("Incorrect syntax!");
            }
        }catch(err){
            console.trace(err);
        }
    }

    async queryDatabaseServer(message){

        try{
            const reg = /^.q(\d+)$/i;

            const result = reg.exec(message.content);

            console.log(result);


            if(result != null){

                let id = parseInt(result[1]);

                if(id !== id){
                    message.channel.send("Server ID must be a valid integer.");
                    return;
                }

                const servers = await this.servers.getAllServers();

               // console.table(servers);

                if(servers.length < id || id < 1){
                    message.channel.send(`There is no server with the id ${id}`);
                    return;
                }

                id = id - 1;

                this.query.getServer(servers[id].ip, servers[id].port, message.channel)

            }else{
                message.channel.send("Incorrect syntax! Correct is `.q serverid` Use .servers command to see available servers.");
            }
        }catch(err){
            console.trace(err);
        }
    }

    bCanRespond(bCanPost, channel){

        if(!bCanPost){
            channel.send("The bot is not enabled in this channel, only admin commands will work.");
        }
    }

    helpCommand(message){

        let string = `**UT2004 Server Query Help.**

**User Commands**
\`.servers\` Displays the basic server information for all the servers added to the database.
\`.q<serverId>\` Displays the server's name, current gametype, map, and players.
\`.q <server ip>:<port>\` Displays a server's name, current gametype, map, and players.

**Admin Commands**
\`.allowchannel\` Enables the bot to be used in the current channel.
\`.deletechannel\` Disables the bot from being used in the current channel.
\`.allowrole <role name>\` Enables users with the specified role to use admin commands.
\`.deleterole <role name>\` Disables users with the specified role to use the admin commands.
\`.addserver <alias> <ip>:<port>\` Adds the specified server to the database.
\`.deleteserver <serverid>\` Deletes the server with the specified id.
`;
        message.channel.send(string);

    }


    async displayServerIp(message){

        try{
            const reg = /^\.ip(\d+)$/i;

            const result = reg.exec(message.content);

            if(result != null){

                const servers = await this.servers.getAllServers();

                console.table(servers);

                const id = parseInt(result[1]) - 1;

                if(id > servers.length || id < 0){
                    message.channel.send(`There is no server with the id ${id + 1}. Use .servers to see available servers`);
                }else{

                    const data = servers[id];

                    let string = `${data.name} (${data.alias})\n**<ut2004://${data.ip}:${data.port}>**`;

                    message.channel.send(string);
                    
                }
            }
        }catch(err){
            console.trace(err);
        }
    }

    async parseCommand(message){

        try{


            if(message.author.bot) return;

            const adminMessage = "You do not have permission to use this command.";

            const adminRoles = await this.getAllAdminRoles();
            
            const bAdmin = this.bUserAdmin(message, adminRoles);

            const bCanPost = await this.canBotPostInChannel(message, false);

            if(!bCanPost){

                if(!bAdmin){

                    if(message.content.startsWith(".")){
                       message.channel.send("The bot is not enabled for this channel.");
                    }

                    return;
                }
            }

            const queryServerReg = /^.q (.+?):{0,1}(\d{1,5})$/i;
            const altServerQuery = /^.q(\d+)$/i;

            if(altServerQuery.test(message.content)){

                this.queryDatabaseServer(message);
                
            }else if(queryServerReg.test(message.content)){
       
                const result = queryServerReg.exec(message.content);
                this.query.getServer(result[1], parseInt(result[2]), message.channel);
            
            }else if(message.content == ".servers"){
      
                this.listServers(message);
                          
            }else if(message.content == ".help"){

                this.helpCommand(message);

            }else if(message.content.startsWith(".ip")){

                this.displayServerIp(message);

            }

            const adminCommands = [
                ".addserver",
                ".deleteserver",
                ".allowchannel",
                ".deletechannel",
                ".allowrole",
                ".deleterole"
            ];

            let bUsingAdminCommand = false;

            for(let i = 0; i < adminCommands.length; i++){

                if(message.content.startsWith(adminCommands[i])){
                    bUsingAdminCommand = true;
                    break;
                }
            }
            
            if(bUsingAdminCommand){

                if(!bAdmin){
                    message.channel.send(adminMessage);
                    return;
                }

                if(message.content.startsWith(".addserver")){
              
                    this.addServer(message);
                    
                }else if(message.content.startsWith(".deleteserver")){
          
                    this.removeServer(message);             

                }else if(message.content == ".allowchannel"){
       
                    this.allowChannel(message);        

                }else if(message.content == ".deletechannel"){

                    this.removeChannel(message);      

                }else if(message.content.startsWith(".allowrole")){

                    this.allowRole(message);
                    
                }else if(message.content.startsWith(".deleterole")){

                    this.removeRole(message);          
                }
            }

        }catch(err){
            console.trace(err);
        }

    }

    createClient(){

        this.client = new Discord.Client();

        this.client.on('ready', () =>{
            console.log("I'm Ready, I'm Ready, I'm Ready (In spongebobs voice)");
        });

        this.client.on('error', (err) =>{

            console.trace(err);
        });

        this.client.on('message', (message) =>{

            this.parseCommand(message);
        });

        this.client.login(config.token);
    }
}

module.exports = Bot;