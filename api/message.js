const { MessageEmbed } = require("discord.js"); 

class Message{

    constructor(type, channel, title, message){

        this.type = type;
        this.channel = channel;
        this.title = title;
        this.message = message;

        this.icon = (type === "pass") ? ":white_check_mark:" : ":warning:";
        
    }

    async send(){

        const message = new MessageEmbed().setColor('#0099ff')
        .setTitle(`${this.icon} ${this.title} ${this.icon}`)
        .setDescription(this.message);

        await this.channel.send({"embeds": [message]});
    }

}

module.exports = Message;