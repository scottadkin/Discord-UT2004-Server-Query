const dns = require('dns');
const Promise = require('promise');
const config = require('./config.json');
const Discord = require('discord.js');

class Servers{

    constructor(db){    

        this.db = db;

    }

    async addServer(message){

        try{

            const reg = /^.addserver (.+) (((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+|))|((.+?)(:\d+|)))$/i;

            const result = reg.exec(message.content);

            if(result != null){

                let ip = 0;
                let port = 7777;
                let alias = result[1];

                if(result[3] !== undefined){

                    ip = result[4];

                    if(result[5] !== ''){
                        port = parseInt(result[5].replace(':',''));
                    }

                    await this.insertServer(message, alias, ip, port);

                }else{
       
                    dns.lookup(result[7], async (err) =>{

                        try{

                            if(err){
                                message.channel.send(`${config.failIcon} Ip address for that domain does not exist!`);
                                throw new Error(err);
                            }

                            ip = result[7];

                            if(result[8] !== ''){
                                
                                port = parseInt(result[8].replace(':',''));
                            }

                            await this.insertServer(message, alias, ip, port);
                            
                        }catch(err){
                            console.trace(err);
                        }
                    });
                    
                }        

            }else{
                message.channel.send(`${config.failIcon} Incorrect syntax for ${config.commandPrefix}addserver.`);
            }

        }catch(err){
            console.trace(err);
        }
    }

    async insertServer(message, alias, ip, port){

        try{

            if(!await this.bServerAlreadyAdded(ip, port)){

                await this.insertServerQuery(alias, ip, port);

                message.channel.send(`${config.passIcon} Server **${alias} (${ip}:${port})** added successfully.`);

            }else{
                message.channel.send(`${config.failIcon} A server with that IP and Port has already been added.`);
            }

        }catch(err){

            console.trace(err);
        }
    }

    insertServerQuery(alias, ip, port){

        return new Promise((resolve, reject) =>{

            const query = "INSERT INTO servers VALUES('Another UT2004 Server',?,?,?,0,0,'N/A','N/A','xx',?,?, -1)";

            const now = Math.floor(Date.now() * 0.001);

            const vars = [alias, ip, port, now, now];

            this.db.run(query, vars, (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    bServerAlreadyAdded(ip, port){

        return new Promise((resolve, reject) =>{

            const query = "SELECT COUNT(*) as total_servers FROM servers WHERE ip=? AND port=?";

            this.db.get(query, [ip, port], (err, result) =>{

                if(err) reject(err);

                if(result !== undefined){
                    if(result.total_servers > 0) resolve(true);           
                }

                resolve(false);

            });
        });
    }

    getAllServers(){

        return new Promise((resolve, reject) =>{

            const query = "SELECT * FROM servers ORDER BY added ASC";

            const servers = [];

            this.db.each(query, (err, row) =>{

                if(err) reject(err);
                
                servers.push(row);

            }, (err) =>{

                if(err) reject(err);

                resolve(servers);
            });
        });
    }

    async getServerById(id){

        try{

            id = parseInt(id);

            if(id !== id) return;

            const servers = await this.getAllServers();

            id = id - 1;

            if(id < 0 || id > servers.length - 1){

                return null;

            }

            return servers[id];

        }catch(err){
            console.trace(err);
        }
    }

    deleteServerQuery(ip, port){

        return new Promise((resolve, reject) =>{

            const query = "DELETE FROM servers WHERE ip=? AND port=?";

            this.db.run(query, [ip, port], (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    async deleteServer(message){

        try{

            const reg = /^.deleteserver (\d+)$/i;

            const result = reg.exec(message.content);

            if(result !== null){

                let id = parseInt(result[1]);

                if(id !== id) throw new Error("Sever id must be a valid integer.");

                const server = await this.getServerById(id);
                
                if(server !== null){

                    //console.log(server);

                    await this.deleteServerQuery(server.ip, server.port);
                    message.channel.send(`${config.passIcon} Server deleted.`);

                }else{

                    message.channel.send(`${config.failIcon} There is no server with the id ${id}`);
                }

            }else{

                message.channel.send(`${config.failIcon} Incorrect syntax for ${config.commandPrefix}deleteserver.`);
            }

        }catch(err){
            console.trace(err);
        }
    }

    forceStringLength(value, target, bAlt){

        value = value.toString();

        if(value.length > target) return value.slice(0, target);

        while(value.length < target){

            if(bAlt === undefined){
                value += ` `;
            }else{
                value = ` ${value}`;
            }
        }

        return value;
        
    }

    createServerString(id, server){

        const idLength = 3;
        const aliasLength = 25;
        const mapLength = 25;
        const playersLength = 10;

        let string = '';

        if(arguments.length !== 0){


            const now = Math.floor(Date.now() * 0.001);

            if(now - server.modified <= config.serverInfoInterval * 2){

                let playersString = `${server.players}/${server.max_players}`;

                string = `\`${this.forceStringLength(id, idLength)}`;
                string += `${this.forceStringLength(server.alias, aliasLength)}`
                string +=  `${this.forceStringLength(server.map, mapLength)}`;
                string +=  `${this.forceStringLength(playersString, playersLength, 1)}\`\n`;

            }else{

                string = `\`${this.forceStringLength(id, idLength)}`;
                string += `${this.forceStringLength(server.alias, aliasLength)}`
                string +=  `${this.forceStringLength('TIMEDOUT', mapLength)}`;
                string +=  `${this.forceStringLength('N/A', playersLength, 1)}\`\n`;
            }

        }else{

            string = `\`${this.forceStringLength("ID", idLength)}`;
            string += `${this.forceStringLength("Alias", aliasLength)}`
            string += `${this.forceStringLength("Map", mapLength)}`;
            string += `${this.forceStringLength("Players", playersLength, 1)}\`\n`;

        }

        return string;
    }

    async displayAllServers(channel, bOnlyActive){

        try{



            const messages = [];

            const servers = await this.getAllServers();

            let string = ``;
            let currentServers = 0;

            for(let i = 0; i < servers.length; i++){

                if(currentServers % config.serversPerMessage === 0 && currentServers !== 0){
                    messages.push(string);
                    currentServers = 0;
                    string = '';
                }

                if(bOnlyActive){

                    if(servers[i].players > 0){
                        currentServers++;
                        string += this.createServerString(i + 1, servers[i]);
                    }

                }else{
                    string += this.createServerString(i + 1, servers[i]);
                    currentServers++;
                }
            }

            if(messages.length === 0){

                if(string == ''){

                    if(bOnlyActive){
                        string = `:zzz: There are currently no servers added.`;
                    }else{
                        string = `:zzz: There are currently no servers with active players.`;
                    }
                }
            }

            if(string !== ''){
                messages.push(string);
            }

            const title = (!bOnlyActive) ? `Unreal Tournament 2004 Servers` : `Active Unreal Tournament 2004 Servers` ;

            let response = null;

            for(let i = 0; i < messages.length; i++){

                if(i === 0){
                    response = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle(title)
                    .setDescription(`Type **${config.commandPrefix}qID** to get more information about a server.`)
                    .addField(this.createServerString(), messages[i]);
                }else{
                    response = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setDescription(messages[i])
                }

                await channel.send(response);
            }

        }catch(err){
            console.trace(err);
        }   
    }

    updateServerInfo(ip, port, data){

        return new Promise((resolve, reject) =>{

            //console.log(`updateServerInfo ${ip}:${port}`);
           // console.log(data);

            const query = `UPDATE servers SET name=?,players=?,max_players=?,map=?,gametype=?,modified=? WHERE ip=? AND port=?`;

            const now = Math.floor(Date.now() * 0.001);

            const vars = [data.name, data.currentPlayers, data.maxPlayers, data.map, data.gametype, now, ip, port];

            this.db.run(query, vars, (err) =>{

                if(err) reject(err);

                resolve();
            }); 
        });
    }

    edit(server, type, value){

        return new Promise((resolve, reject) =>{

            const query = `UPDATE servers SET ${type}=? WHERE ip=? AND port=?`;

            const vars = [value, server.ip, server.port];

            this.db.run(query, vars, (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    getServerAutoMessageId(ip, port){

        //console.log(`${ip}:${port}`);

        return new Promise((resolve, reject) =>{

            const query = "SELECT last_message FROM servers WHERE ip=? AND port=?";

            this.db.get(query, [ip, port], (err, result) =>{

                if(err) reject(err);
                
                if(result !== undefined){
                    
                    if(result.last_message !== '-1'){

                        resolve(result.last_message);

                    }else{
                        resolve(null);
                    }
                }
                resolve(null);
            });
        });
    }

    setAutoMessageId(ip, port, messageId){

        return new Promise((resolve, reject) =>{

            const query = `UPDATE servers SET last_message=? WHERE ip=? AND PORT=?`;

            this.db.get(query, [messageId, ip, port], (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    resetAllAutoMessageIds(){

        return new Promise((resolve, reject) =>{

            const query = "UPDATE servers SET last_message='-1'";

            this.db.run(query, (err) =>{

                if(err) reject(err);

                resolve();

            });
        });
    }


    getAllIpPorts(){

        return new Promise((resolve, reject) =>{

            const servers = [];

            const query = "SELECT ip,port FROM servers";

            this.db.each(query, (err, result) =>{

                if(err) reject(err);

                servers.push(result);

            }, (err) =>{

                if(err) reject(err);

                resolve(servers);
            });
        });
    }


    getServerFlag(ip, port){

        return new Promise((resolve, reject) =>{

            const query = "SELECT country FROM servers WHERE ip=? AND port=?";

            this.db.get(query, [ip, port], (err, result) =>{

                if(err) reject(err);

                if(result !== undefined){

                    resolve(result.country);
                }

                resolve('xx');
            });
        });
    }

}

module.exports = Servers;