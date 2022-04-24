const { Client, Intents, MessageEmbed } = require("discord.js");
const { token, avatarImage, queryPrefix, defaultServerPort } = require("./config.json");
const UT2K4Query = require("./api/ut2k4query");
const serverQueryMessage = require("./api/serverQueryMessage");
const Functions = require("./api/functions");
const Database = require("./api/database");
const Commands = require("./api/commands");

const testIp = "80.4.151.145";
const testPort = 7777;

const testIp2 = "74.91.115.167";
const testIp3 = "81.30.148.30";

const testPort2 = 32800;

const discordOptions = { 
    "intents": [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
    "sweepers": {
        "messages": {"lifetime": 60, "interval": 300}
    } 
}

const commandsManager = new Commands();


const testServer = new UT2K4Query();

const client = new Client(discordOptions);

client.once("ready", () => {
	console.log("Ready!");

    //client.user.setAvatar(avatarImage);
});

client.on("error", (err) =>{
    console.trace(err);
});


client.on("messageCreate", async message =>{

    if(message.author.bot) return;

    if(commandsManager.bIsCommand(message.content)){

        const command = commandsManager.removePrefix(message.content);

        if(command.startsWith("q")){

            await commandsManager.queryServer(message.channel, command, testServer);
            return;

        }


    }else{
        console.log("Not a command");
        return;
    }

});
                      
// Login to Discord with your client"s token
client.login(token);