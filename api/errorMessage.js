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
        .setDescription(this.message);

        await this.channel.send({"embeds": [error]});
    }
}

module.exports = ErrorMessage;

