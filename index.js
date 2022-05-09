const { Client, Intents, MessageEmbed } = require("discord.js");
const { token, avatarImage, queryPrefix, defaultServerPort } = require("./config.json");
const UT2K4Query = require("./api/ut2k4query");
const Command = require("./api/command");

const discordOptions = { 
    "intents": [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
    "sweepers": {
        "messages": {"lifetime": 60, "interval": 300}
    } 
}


const utQuery = new UT2K4Query();

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

    const command = new Command(message, utQuery);

    await command.processCommand();

});
                      
client.login(token);