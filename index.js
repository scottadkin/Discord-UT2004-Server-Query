const { Client, Intents, MessageEmbed } = require("discord.js");
const { token, avatarImage, queryPrefix, defaultServerPort } = require("./config.json");
const UT2K4Query = require("./api/ut2k4query");
const serverQueryMessage = require("./api/serverQueryMessage");
const Functions = require("./api/functions");
const Database = require("./api/database");
const Command = require("./api/command");
const Servers = require("./api/servers");

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


const utQuery = new UT2K4Query();
const serverManager = new Servers();

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

    if(!Command.bIsCommand(message.content)) return;

    const command = new Command(message, utQuery, serverManager);

    await command.processCommand();

    //const command = commandsManager.removePrefix(message.content);



  

});
                      
// Login to Discord with your client"s token
client.login(token);