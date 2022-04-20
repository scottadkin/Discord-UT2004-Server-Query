const { Client, Intents, MessageEmbed } = require("discord.js");
const { token } = require("./config.json");
const UT2K4Query = require("./api/ut2k4query");
const serverQueryMessage = require("./api/serverQueryMessage");
const Functions = require("./api/functions");
//80.4.151.145
//74.91.115.167

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


const testServer = new UT2K4Query();

//testServer.fetchBasicInfo(testIp, testPort + 1);
//testServer.fetchGameInfo(testIp, testPort + 1);
//testServer.fetchPlayerInfo(testIp, testPort + 1);


//setInterval(() =>{
 //   testServer.fetchBasicInfo(testIp, testPort + 1);
//}, 500);


// Create a new client instance
const client = new Client(discordOptions);

// When the client is ready, run this code (only once)
client.once("ready", () => {
	console.log("Ready!");
});

client.on("error", (err) =>{
    console.trace(err);
});


client.on("messageCreate", async message =>{


    if(Functions.bValidIp(message.content)){

        const parts = message.content.split(":");

        testServer.fetchFullResponse(parts[0], parseInt(parts[1]) + 1, message.channel);

        return;
    }

    if(message.content === "list"){

        testServer.createNewListResponse(message.channel);
    }

    if(message.content === "basic"){

        testServer.fetchBasicInfo(testIp, testPort + 1);
    }

    if(message.content === "test"){

        //testServer.fetchFullResponse(testIp, testPort + 1, message.channel);
        testServer.fetchFullResponse(testIp, testPort + 1, message.channel);
        //new serverQueryMessage(MessageEmbed, message.channel);
    }

    if(message.content === "test2"){
        testServer.fetchFullResponse(testIp2, testPort + 1, message.channel);
    }

    if(message.content === "test3"){
        testServer.fetchFullResponse(testIp3, testPort2 + 1, message.channel);
    }

    if(message.content === "test4"){
        // /109.230.224.189:6969
        testServer.fetchFullResponse("109.230.224.189", 6969 + 1, message.channel);
    }

    if(message.content === "broken"){
        testServer.fetchFullResponse("1.1.1.1", 7778, message.channel);
    }
});
                      
// Login to Discord with your client"s token
client.login(token);