const { MessageEmbed } = require("discord.js");
const { queryPrefix, icon, defaultServerPort } = require("../config.json");

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
            ["addserver <Server IP & Port>", `Adds a server to the databaser.`],
            ["deleteserver <ServerID>","Delete selected server from the database."],
            ["giveadmin <Discord Role>","Give users with the discord role admin privileges."],
            ["removeadmin <Discord Role>","Remove admin privileges for users with the discord role."],
        ];


        let string = ``;

        for(let i = 0; i < messages.length; i++){

            const m = messages[i];

            string += `${icon} **${queryPrefix}${m[0]}** ${m[1]}\n`;
        }

        string += `\n${icon} Type **${queryPrefix}help <command>** for more detailed information about a command.`

        return {"title": "General Help", "text":string};

    }

    addServerHelp(){


        const messages = [
            `Adds a server to the database.`,
            `A full command is as follows: **${queryPrefix}addserver <ip>:<port> server name**.`,
            `You can skip the port and a default of port **${defaultServerPort}** will be used.`,
            `You can skip the server name and it will use the server's name from the pinged data.\n`,
            `**Valid examples:**
            ${queryPrefix}addserver 12.34.56.78:7777 A ut2004 server
            ${queryPrefix}addserver 12.34.56.78:7777
            ${queryPrefix}addserver 12.34.56.78 A ut2004 server
            ${queryPrefix}addserver 12.34.56.78`
       
        ];

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

        return {"title": "Unknown help command" ,"text": `${icon} Unknown command: **${this.helpCommand}**.`};
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