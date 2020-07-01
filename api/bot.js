const Promise = require('promise');
const Discord = require('discord.js');
const UT2004Query = require('./ut2004q');

class Bot{

    constructor(){

        this.createClient();
        this.query = new UT2004Query();
    }



    createClient(){

        this.client = new Discord.Client();

        this.client.on('ready', () =>{
            console.log("I'm Ready, I'm Ready (In spongebobs voice)");
        });

        this.client.on('error', (err) =>{

            console.trace(err);
        });

        this.client.on('message', (message) =>{

            console.log(message.content);

            const queryServerReg = /^.q (.+?):{0,1}(\d{1,5})$/i;

            console.log(queryServerReg.exec(message.content));

            if(queryServerReg.test(message.content)){

                const result = queryServerReg.exec(message.content);

                this.query.getServer(result[1], parseInt(result[2]), message.channel);

            }
        });

        this.client.login('');
    }
}

module.exports = Bot;