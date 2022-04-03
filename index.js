const { Client, Intents, MessageEmbed } = require("discord.js");
const { token } = require("./config.json");
const UT2K4Query = require("./api/ut2k4query");
const serverQueryMessage = require("./api/serverQueryMessage");
//80.4.151.145
//74.91.115.167
const testIp = "80.4.151.145";
const testPort = 7777;


const discordOptions = { 
    "intents": [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
    "sweepers": {
        "messages": {"lifetime": 60, "interval": 300}
    } 
}


const testServer = new UT2K4Query();
/*
testServer.fetchBasicInfo(testIp, testPort + 1);
testServer.fetchGameInfo(testIp, testPort + 1);
testServer.fetchPlayerInfo(testIp, testPort + 1);
*/



// Create a new client instance
const client = new Client(discordOptions);

// When the client is ready, run this code (only once)
client.once("ready", () => {
	console.log("Ready!");
});


client.on("messageCreate", async message =>{

    console.log(message);

    if(message.content === "test"){

        /*const exampleEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Some title')
        .setURL('https://discord.js.org/')
        .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
        .setDescription('Some description here')
        .setThumbnail('https://i.imgur.com/AfFp7pu.png')
        .addFields(
            { name: 'Regular field title', value: 'Some value here' },
            { name: '\u200B', value: '\u200B' },
            { name: 'Inline field title', value: 'Some value here', inline: true },
            { name: 'Inline field title', value: 'Some value here', inline: true },
        )
        .addField('Inline field title', 'Some value here', true)
        .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

        message.channel.send({"embeds": [exampleEmbed]});*/

        new serverQueryMessage(MessageEmbed, message.channel);
    }
});

// Login to Discord with your client"s token
client.login(token);