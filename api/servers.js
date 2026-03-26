import { failIcon, passIcon, commandPrefix, serverInfoInterval, serversPerMessage, embedColor } from "../config.js";
import { EmbedBuilder } from "discord.js";
import {simpleQuery} from "./database.js";
import { bValidAddress } from "./generic.js";


export default class Servers{

    constructor(){}

    async addServer(message){

        const reg = /^.addserver (.+) (((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+|))|((.+?)(:\d+|)))$/i;

        const result = reg.exec(message.content);

        if(result === null){     
            return await message.channel.send(`${failIcon} Incorrect syntax for ${commandPrefix}addserver.`);
        }

        let ip = 0;
        let port = 7777;
        let alias = result[1];

        if(result[3] !== undefined){

            ip = result[4];

            if(result[5] !== ''){
                port = parseInt(result[5].replace(':',''));
            }

            this.insertServer(message, alias, ip, port);

        }else{

            if(await bValidAddress(result[7])){
                ip = result[7];
            }else{
                throw new Error(`Failed to lookup ${result[7]}`);
            }

            if(result[8] !== ""){
                port = parseInt(result[8].replace(":",""));
            }

            this.insertServer(message, alias, ip, port);
        }
    }

    insertServer(message, alias, ip, port){

        if(!this.bServerAlreadyAdded(ip, port)){

            this.insertServerQuery(alias, ip, port);

            message.channel.send(`${passIcon} Server **${alias} (${ip}:${port})** added successfully.`);

        }else{
            message.channel.send(`${failIcon} A server with that IP and Port has already been added.`);
        }
    }

    insertServerQuery(alias, ip, port){

        const query = "INSERT INTO servers VALUES('Another UT2004 Server',?,?,?,0,0,'N/A','N/A','xx',?,?, -1)";

        const now = Math.floor(Date.now() * 0.001);

        const vars = [alias, ip, port, now, now];

        return simpleQuery(query, vars);
    }

    bServerAlreadyAdded(ip, port){

        const query = "SELECT COUNT(*) as total_servers FROM servers WHERE ip=? AND port=?";
        const result = simpleQuery(query, [ip, port]);

        return result[0].total_servers > 0;


    }

    getAllServers(){

        const query = "SELECT * FROM servers ORDER BY added ASC";
        return simpleQuery(query);
    }

    getServerById(id){


        id = parseInt(id);

        if(id !== id) return null;

        const servers = this.getAllServers();

        id = id - 1;

        if(id < 0 || id > servers.length - 1){

            return null;

        }

        return servers[id];

    }

    deleteServerQuery(ip, port){

        const query = "DELETE FROM servers WHERE ip=? AND port=?";
        return simpleQuery(query, [ip, port]);
    }

    async deleteServer(message){

        try{

            const reg = /^.deleteserver (\d+)$/i;

            const result = reg.exec(message.content);

            if(result !== null){

                let id = parseInt(result[1]);

                if(id !== id) throw new Error("Sever id must be a valid integer.");

                const server = this.getServerById(id);
                
                if(server !== null){

                    //console.log(server);

                    this.deleteServerQuery(server.ip, server.port);
                    message.channel.send(`${passIcon} Server deleted.`);

                }else{

                    message.channel.send(`${failIcon} There is no server with the id ${id}`);
                }

            }else{

                message.channel.send(`${failIcon} Incorrect syntax for ${commandPrefix}deleteserver.`);
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

            if(now - server.modified <= serverInfoInterval * 2){

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

        const messages = [];

        const servers = this.getAllServers();

        let string = ``;
        let currentServers = 0;

        for(let i = 0; i < servers.length; i++){

            if(currentServers % serversPerMessage === 0 && currentServers !== 0){
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

                if(!bOnlyActive){
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
                response = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(title)
                .setDescription(`Type **${commandPrefix}qID** to get more information about a server.`)
                .addFields({"name": this.createServerString(), "value": messages[i]});
            }else{
                response = new EmbedBuilder()
                .setColor(embedColor)
                .setDescription(messages[i])
            }

            await channel.send({"embeds": [response]});
        }
    }

    updateServerInfo(ip, port, data){


        const now = Math.floor(Date.now() * 0.001);

        const query = `UPDATE servers SET name=?,players=?,max_players=?,map=?,gametype=?,modified=? WHERE ip=? AND port=?`;

        simpleQuery(query, [data.name, data.currentPlayers, data.maxPlayers, data.map, data.gametype, now, ip, port]);
    }

    edit(server, type, value){

        const query = `UPDATE servers SET ${type}=? WHERE ip=? AND port=?`;

        const vars = [value, server.ip, server.port];

        return simpleQuery(query, vars);

    }

    getServerAutoMessageId(ip, port){

        const query = "SELECT last_message FROM servers WHERE ip=? AND port=?";
        const vars = [ip, port];

        const result = simpleQuery(query, vars);

        if(result.length === 0) return null;

        if(result[0].last_message !== "-1") return result[0].last_message;

        return null;
    }

    setAutoMessageId(ip, port, messageId){

        const query = `UPDATE servers SET last_message=? WHERE ip=? AND PORT=?`;
        const vars = [messageId, ip, port];

        return simpleQuery(query, vars);
    }

    resetAllAutoMessageIds(){

        return simpleQuery("UPDATE servers SET last_message='-1'");
    }


    getAllIpPorts(){

        const query = "SELECT ip,port FROM servers";

        return simpleQuery(query);
    }


    getServerFlag(ip, port){

        const query = "SELECT country FROM servers WHERE ip=? AND port=?";
        const vars = [ip, port];
        const result = simpleQuery(query, vars);

        if(result.length === 0) return "xx";
        return result[0].country;
    }
}