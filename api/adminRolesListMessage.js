const {MessageEmbed} = require("discord.js");
const {queryPrefix} = require("../config.json")


class AdminRolesListMessage{

    constructor(channel, rolesList){

        this.channel = channel;
        this.roles = rolesList;
    }

    async send(){

        let text = "";

        if(this.roles.length === 0){

            text = `:white_small_square: No roles have been given admin privileges, this means anyone can use admin commands.
            :white_small_square: To stop this, simply add one role group using the **${queryPrefix}giveadmin <role name>** command.`;

        }else{

            for(let i = 0; i < this.roles.length; i++){

                const r = this.roles[i];

                text += `:white_small_square:${r.name}\n`;
            }
        }

        const message = new MessageEmbed().setColor('#0099ff')
        .setTitle(`Roles with admin privileges`)
        .setDescription(text);

        await this.channel.send({"embeds": [message]});
    }
}

module.exports = AdminRolesListMessage;