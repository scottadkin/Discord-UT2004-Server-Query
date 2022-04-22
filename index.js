const { Client, Intents, MessageEmbed } = require("discord.js");
const { token, avatarImage, queryPrefix } = require("./config.json");
const UT2K4Query = require("./api/ut2k4query");
const serverQueryMessage = require("./api/serverQueryMessage");
const Functions = require("./api/functions");
const Database = require("./api/database");


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

    //client.user.setAvatar(avatarImage);
});

client.on("error", (err) =>{
    console.trace(err);
});


client.on("messageCreate", async message =>{

    if(!message.content.startsWith(queryPrefix)) return;

    const reg = new RegExp(`^${queryPrefix}(.+)$`,"i")

    const result = reg.exec(message.content);

    if(result === null) return;

    const command = result[1];
    const commandLC = result[1].toLowerCase();

    console.log(command);

    if(commandLC.startsWith("q")){

        const ipReg = /^q (.+)$/i;

        const ipResult = ipReg.exec(command);

        if(ipResult !== null){

            const parts = ipResult[1].split(":");

            testServer.fetchFullResponse(parts[0], parseInt(parts[1]) + 1, message.channel);
        }

    }

    if(message.content === "list"){

        testServer.createNewListResponse(message.channel);
    }

    if(message.content === "basic"){

        testServer.fetchBasicInfo(testIp, testPort + 1);
    }

    if(message.content === "test"){

        testServer.fetchFullResponse(testIp, testPort + 1, message.channel);
    }

    if(message.content === "test2"){
        testServer.fetchFullResponse(testIp2, testPort + 1, message.channel);
    }

    if(message.content === "test3"){
        testServer.fetchFullResponse(testIp3, testPort2 + 1, message.channel);
    }

    if(message.content === "test4"){
        testServer.fetchFullResponse("109.230.224.189", 6969 + 1, message.channel);
    }

    if(message.content === "broken"){
        testServer.fetchFullResponse("1.1.1.1", 7778, message.channel);
    }
});
                      
// Login to Discord with your client"s token
client.login(token);