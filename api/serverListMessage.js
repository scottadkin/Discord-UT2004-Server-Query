const { MessageEmbed } = require("discord.js"); 
const { queryPrefix } = require("../config.json");

class ServerListMessage{

    constructor(response){

        this.response = response;

        this.send();
    }

    fixString(input, maxLength){

        if(input.length > maxLength){   
            return `${input.slice(0, maxLength)}`;
        }

        let missingChars = maxLength - input.length;

        //return input;
        return `${input}${" ".repeat(missingChars)}`;

    }

    createServerFields(){

        const servers = this.response.servers; 

        const nameLength = 31;
        const mapLength = 20;
        const playersLength = 7;
        const idLength = 3;

        let string = "";

        string += `\`${this.fixString("ID", idLength)} ${this.fixString("Server Name", nameLength)}\t${this.fixString("Map", mapLength)}\tPlayers\`\n`;

        for(let i = 0; i < servers.length; i++){

            const s = servers[i];

            const id = this.fixString(i+1, idLength);

            if(s.bFinished){

                const map = this.fixString(s.data.map, mapLength);
                const serverName = this.fixString(s.data.name, nameLength);
                const players = this.fixString(`${s.data.players.players}/${s.data.players.maxPlayers}`, playersLength);

                string += `\`${id} - ${serverName}\t${map}\t${players}\`\n`;

            }else{

                const map = this.fixString(`${s.ip}:${s.port}`, mapLength);
                const serverName = this.fixString("Server Timed out", nameLength);
             

                string += `\`${id} - ${map}\t\t\t   ${serverName}\`\n`;
            }
            
   
        }

        return string;
    }

    getInfo(){

        return `Query a server by using **${queryPrefix}q <serverId>** for more details.`;
    }

    async send(){

        const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle("Unreal Tournament 2004 Server List")
       // .setURL('https://discord.js.org/')
        //.setAuthor({ "name": `Server List`, iconURL: 'https://i.imgur.com/ihsPMOD.png', url: 'https://github.com/scottadkin/Discord-UT2004-Server-Query' })
        .setDescription(`${this.getInfo()}\n\n${this.createServerFields()}`)
        //.setThumbnail('https://i.imgur.com/ihsPMOD.png')
       // .addFields(this.createServerFields()
            //{ name: 'Regular field title', value: 'Some value here' },
           //{ name: '\u200B', value: '\u200B' },
           // [{ name: 'Red Team', value: 'Some value here', inline: true },
            //{ name: 'Blue Team', value: 'Some value here', inline: true },]
            //{ name: '**Join as Player:** <ut2004://www.google.com>', value: '\u200B', inline: false },
           // { name: '**Join as Spectator:** <ut2004://www.google.com>', value: '\u200B', inline: false },
       // )
        //.addField(`Join Server`,`**<ut2004://**`, false)
        //.addField(`Join Server as Spectator`,`**<ut2004://**`, false)
       // .addField('Inline field title', 'Some value here', true)
        //.setImage('https://i.imgur.com/ihsPMOD.png')
        .setTimestamp()
        .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/ihsPMOD.png' });

        await this.response.channel.send({"embeds": [embed]});
        this.response.bSentMessageToDiscord = true;
    }
}

module.exports = ServerListMessage;