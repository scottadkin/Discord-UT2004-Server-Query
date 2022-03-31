const { Client, Intents } = require("discord.js");
const { token } = require("./config.json");
const UT2K4Query = require("./api/ut2k4query.js");
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

testServer.fetchBasicInfo(testIp, testPort + 1);
testServer.fetchGameInfo(testIp, testPort + 1);
testServer.fetchPlayerInfo(testIp, testPort + 1);


/*
// Create a new client instance
const client = new Client(discordOptions);

// When the client is ready, run this code (only once)
client.once("ready", () => {
	console.log("Ready!");
});


client.on("messageCreate", async message =>{
    console.log(message);
});

// Login to Discord with your client"s token
client.login(token);*/