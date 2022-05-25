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

    createEmbedData(title, messages){

        let string = ``;

        for(let i = 0; i < messages.length; i++){

            const m = messages[i];

            //all help command array
            if(m.length === 2){
                string += `${icon} **${queryPrefix}${m[0]}** ${m[1]}\n`;
            }else{
                string += `${icon} ${m}\n`;
            }

        }

        return {"title": title, "text": string};
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


        return this.createEmbedData("General Help", messages);

    }

    getServerHelp(){


        const messages = [
            `Adds a server to the database.`,
            `A full command is as follows: **${queryPrefix}addserver <ip>:<port> server name**.`,
            `You can skip the port and a default of port **${defaultServerPort}** will be used.`,
            `You can skip the server name and it will use the server's name from the pinged data.\n`,
            `**Valid Examples:**
            ${queryPrefix}addserver 12.34.56.78:7777 A ut2004 server
            ${queryPrefix}addserver 12.34.56.78:7777
            ${queryPrefix}addserver 12.34.56.78 A ut2004 server
            ${queryPrefix}addserver 12.34.56.78`
       
        ];

        return this.createEmbedData("Add Server Help", messages);
    }

    getListHelp(){

        const messages = [
            `Displays a list of servers added to the database.`,
            `Use **${queryPrefix}addserver** to add a server to the list.`,
            `Use **${queryPrefix}deleteserver** to remove a server from the list.`
        ];

        return this.createEmbedData("List Servers Help", messages);

    }

    getQHelp(){

        const messages = [
            `Queries a server a UT2004 server and posts the response to a Discord channel.`,
            `**${queryPrefix}q <serverID>** Will query a server from the ${queryPrefix}list database.`,
            `**${queryPrefix}q <ip:port>** Will query that ip and port.\n`,
            `**Valid Examples:**
            **${queryPrefix}q 1** Will query the first server in the **${queryPrefix}list**.
            **${queryPrefix}q 12.34.56.78:7777** Will query that ip and port.
            **${queryPrefix}q 12.34.56.78** Will query that ip and the default port of ${defaultServerPort}.`
        ];

        return this.createEmbedData("Query Server Help", messages);
    }

    getResponse(){

        if(this.helpCommand === undefined){
            return this.getAllHelp();
        }

        if(this.helpCommand === "addserver") return this.getServerHelp();
        if(this.helpCommand === "list") return this.getListHelp();
        if(this.helpCommand === "q") return this.getQHelp();
        

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