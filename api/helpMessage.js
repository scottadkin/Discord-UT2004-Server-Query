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
            ["q<ServerID>", "Pings a server in the database and displays the info."],
            ["q <IP>:<Port>", "Pings the server and displays the info."],
            ["addserver <Server IP & Port>", `Adds a server to the database.`],
            ["deleteserver <ServerID>","Delete selected server from the database."],
            ["giveadmin <Discord Role>","Give users with the discord role admin privileges."],
            ["removeadmin <Discord Role>","Remove admin privileges for users with the discord role."]
        ];


        const data = this.createEmbedData("General Help", messages);
        data.text += `\n${icon} Type **${queryPrefix}help <command>** for more detailed help about a command.`;
        return data;

    }

    getServerHelp(){


        const messages = [
            `Adds a server to ${queryPrefix}list.`,
            `A full command is as follows: **${queryPrefix}addserver <ip>:<port> server name**.`,
            `You can skip the port and a default of port **${defaultServerPort}** will be used.`,
            `You can skip the server name and it will use the server's name from the pinged data.\n`,
            `**Valid Examples:**
            **${queryPrefix}addserver 12.34.56.78:7777 A ut2004 server
            ${queryPrefix}addserver 12.34.56.78:7777
            ${queryPrefix}addserver 12.34.56.78 A ut2004 server
            ${queryPrefix}addserver 12.34.56.78**`
       
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
            `Queries a UT2004 server and posts the response to a Discord channel.`,
            `**${queryPrefix}q <serverID>** Will query a server from the ${queryPrefix}list database.`,
            `**${queryPrefix}q <ip:port>** Will query that ip and port.\n`,
            `**Valid Examples:**
            **${queryPrefix}q 1** Will query the first server in the **${queryPrefix}list**.
            **${queryPrefix}q 12.34.56.78:7777** Will query that ip and port.
            **${queryPrefix}q 12.34.56.78** Will query that ip and the default port of ${defaultServerPort}.`
        ];

        return this.createEmbedData("Query Server Help", messages);
    }

    facepalm(){

        return {"title": "Really...", "text": `What did you think was going to happen?`};
    }

    deleteServerHelp(){

        const messages = [
            `Delete a server from **${queryPrefix}list**.`,
            `Use **${queryPrefix}list** to get the server's id.\n`,
            `**Valid Examples**
            **${queryPrefix}deleteserver 3** Deletes the 3rd server that is in the list.
            **${queryPrefix}deleteserver 69** Deletes the 69th server that is in the list.`
        ];

        return this.createEmbedData("Delete Server Help", messages);
    }

    giveAdminHelp(){

        const messages = [
            `Give a Discord Role admin privileges.`,
            `If no roles have been given admin privileges everyone in the server can use them.`,
            `Role names are case insensitive.\n`,
            `**Valid Examples**
            **${queryPrefix}giveadmin UT2k4Players**
            **${queryPrefix}giveadmin Potatoes**`,
        ];

        return this.createEmbedData("Give Admin Help", messages);
    }

    removeAdminHelp(){

        const messages = [
            `Removes a Discord Role's admin privileges.`,
            `Role names are case insensitive.\n`,
            `**Valid Examples**
            **${queryPrefix}removeadmin UT2k4Players**
            **${queryPrefix}removeadmin Potatoes**`,
        ];

        return this.createEmbedData("Remove Admin Help", messages);
    }

    getResponse(){

        if(this.helpCommand === undefined){
            return this.getAllHelp();
        }

        if(this.helpCommand === "addserver") return this.getServerHelp();
        if(this.helpCommand === "deleteserver") return this.deleteServerHelp();
        if(this.helpCommand === "giveadmin") return this.giveAdminHelp();
        if(this.helpCommand === "removeadmin") return this.removeAdminHelp();
        if(this.helpCommand === "list") return this.getListHelp();
        if(this.helpCommand === "q") return this.getQHelp();
        if(this.helpCommand === "help") return this.facepalm();
        

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