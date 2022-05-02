const { MessageEmbed } = require("discord.js"); 

class ErrorMessage{

    constructor(channel, title, message){

        this.channel = channel;
        this.title = title;
        this.message = message;
        
    }

    async send(){

        const error = new MessageEmbed().setColor('#0099ff')
        .setTitle(`:warning: ${this.title} :warning:`)
       // .setURL('https://discord.js.org/')
        //.setAuthor({ "name": `${this.ip}:${this.port}`, iconURL: 'https://i.imgur.com/ihsPMOD.png', url: 'https://github.com/scottadkin/Discord-UT2004-Server-Query' })
        .setDescription(this.message)
        //.setThumbnail('https://i.imgur.com/ihsPMOD.png')
        //.addField(`Join Server`,`**<ut2004://${this.ip}:${this.port}>**`, false)
        //.addField(`Join Server as Spectator`,`**<ut2004://${this.ip}:${this.port}?spectatorOnly=1>**`, false)
       // .addField('Inline field title', 'Some value here', true)
        //.setImage('https://i.imgur.com/ihsPMOD.png')
        .setTimestamp();
        //.setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/ihsPMOD.png' });

        await this.channel.send({"embeds": [error]});
    }
}

module.exports = ErrorMessage;

