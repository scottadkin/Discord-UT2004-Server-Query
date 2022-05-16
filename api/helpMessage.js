const { MessageEmbed } = require("discord.js");
const { queryPrefix, icon } = require("../config.json");

class HelpMessage{

    constructor(channel, message, bAdminUser){

        this.channel = channel;
        this.message = message;
        this.bAdminUser = bAdminUser;

        this.parseMessage();
    }

    parseMessage(){

        const reg = /^help (.+)$/i;

        const result = reg.exec(this.message);

        if(result === null) return;

        this.helpCommand = result[1];

    }

    getAllHelp(){

        const messages = [
            ["help", "Shows this command."],
            ["list", "Shows all servers added to the database."],
            ["q<ServerID>", "Pings selected server in database and displays the info."],
            ["q <IP>:<Port>", "Pings the server and displays the info."],
            ["addserver <Server IP & Port>", `Type **${queryPrefix}help addserver** for more info.`],
            ["deleteserver <ServerID>","Delete selected server from the database."],
            ["giveadmin <Discord Role>","Give users with the discord role admin privileges."],
            ["removeadmin <Discord Role>","Remove admin privileges for users with the discord role."],
        ];


        let string = ``;

        for(let i = 0; i < messages.length; i++){

            const m = messages[i];

            string += `${icon} **${queryPrefix}${m[0]}** ${m[1]}\n`;
        }

        return {"title": "General Help", "text":string};

    }

    addServerHelp(){


        const messages = ["test"];

        let text = "";

        for(let i = 0; i < messages.length; i++){

            const m = messages[i];

            text += `${icon} ${m}\n`;
        }


        return {"title": "Add server help", "text": text};
    }

    getResponse(){

        if(this.helpCommand === undefined){
            return this.getAllHelp();
        }

        if(this.helpCommand === "addserver"){

            return this.addServerHelp();
        }

        return {"title": "Unknown help command" ,"text": `${icon} Unknown help command.`};
    }

    async send(){

        const {title, text} = this.getResponse();

        const message = new MessageEmbed().setColor('#0099ff')
        .setTitle(title)
        .setDescription(text);

        await this.channel.send({"embeds": [message]});
    }
}


module.exports = HelpMessage;