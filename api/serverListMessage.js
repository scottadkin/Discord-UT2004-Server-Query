const { MessageEmbed } = require("discord.js"); 
const { queryPrefix } = require("../config.json");

class ServerListMessage{

    constructor(response){

        this.response = response;

        this.currentServerIndex = 0;
        this.maxServersPerEmbed = 15;

        this.send();
    }

    fixString(input, maxLength){

        input = input.toString();

        if(input.length >= maxLength){   
            return `${input.slice(0, maxLength)}`;
        }

        let missingChars = maxLength - input.length;

        return `${input}${" ".repeat(missingChars)}`;

    }

    createServerFields(){

        const servers = this.response.servers; 

        const nameLength = 32;
        const mapLength = 20;
        const playersLength = 7;
        const idLength = 3;

        let string = "";

        if(this.currentServerIndex === 0){
            string += `\`${this.fixString("ID", idLength)} ${this.fixString("Server Name", nameLength)}\t${this.fixString("Map", mapLength)}\tPlayers\`\n`;
        }

        const start = this.currentServerIndex;
        const end = (this.currentServerIndex + this.maxServersPerEmbed > servers.length) ? servers.length : start + this.maxServersPerEmbed;

        for(let i = start; i < end; this.currentServerIndex++, i++){

            const s = servers[i];

            const id = this.fixString(i + 1, idLength);

            if(s.bFinished){

                const map = this.fixString(s.data.map, mapLength);
                const serverName = this.fixString(s.data.name, nameLength);
                const players = this.fixString(`${s.data.players.players}/${s.data.players.maxPlayers}`, playersLength);

                string += `\`${id} ${serverName}\t${map}\t${players}\`\n`;

            }else{

                const map = this.fixString("Server Timed out", mapLength);
                const serverName = this.fixString(`${s.ip}:${s.port}`, nameLength);
             
                string += `\`${id} ${serverName}\t${map}\t${this.fixString("N/A", playersLength)}\`\n`;
            }
            
   
        }

        return string;
    }

    getInfo(){

        return `:white_small_square: Query a server by using **${queryPrefix}q <serverId>** for more details.`;
    }

    async send(){

        try{

            const totalServers = this.response.servers.length;
            const embeds = [];

            while(this.currentServerIndex < totalServers){

                let description = "";

                if(embeds.length === 0){
                    description += `${this.getInfo()}\n\n`;
                }

                description += this.createServerFields();

                const embed = new MessageEmbed()
                .setColor("0099ff")
                .setDescription(description);


                if(this.currentServerIndex === 0){
                    embed.setTitle("Unreal Tournament 2004 Server List");
                }

                if(this.currentServerIndex === totalServers){

                    embed.setTimestamp();
                    //.setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/ihsPMOD.png' });
                }

                embeds.push(embed);

            }

            await this.response.channel.send({"embeds": embeds});

        }catch(err){

            console.trace(err);
        }
        
        this.response.bSentMessageToDiscord = true;
    }
}

module.exports = ServerListMessage;