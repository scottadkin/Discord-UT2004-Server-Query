const { MessageEmbed } = require("discord.js"); 

class PassMessage{

    constructor(channel, title, message){

        this.channel = channel;
        this.title = title;
        this.message = message;
        
    }

    async send(){

        const pass = new MessageEmbed().setColor('#0099ff')
        .setTitle(`:white_check_mark: ${this.title} :white_check_mark:`)
        .setDescription(this.message);

        await this.channel.send({"embeds": [pass]});
    }
}

module.exports = PassMessage;

