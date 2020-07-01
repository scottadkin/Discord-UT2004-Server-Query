const Promise = require('promise');
const Discord = require('discord.js');
const UT2004Query = require('./ut2004q');
const config = require('./config');
const db = require('./database');

class Bot{

    constructor(){

        this.createClient();
        this.query = new UT2004Query(db);

        
    }



    bUserAdmin(message){

        const member = message.member;

        //console.log(member);

        return member.roles.cache.some((role) =>{

            if(role.name.toLowerCase() == config.adminRole.toLowerCase()){
                return true;
            }
            return false;
        });

    }


    createClient(){

        this.client = new Discord.Client();

        this.client.on('ready', () =>{
            console.log("I'm Ready, I'm Ready, I'm Ready (In spongebobs voice)");
        });

        this.client.on('error', (err) =>{

            console.trace(err);
        });

        this.client.on('message', (message) =>{


            if(message.author.bot) return;

           // console.log(message.channel.guild.roles.cache);

          // console.log( message.channel.guild.roles.cache);

            console.log(this.bUserAdmin(message));

         
            //console.log(this.getRole(config.adminRole, message));
       
           //..console.log(this.client);
            //console.log("role = " +this.getRoleId(config.adminRole));

           // console.log(message.author.cache.roles.some(role => role.name === config.adminRole));

            console.log(message.content);

            const queryServerReg = /^.q (.+?):{0,1}(\d{1,5})$/i;

            console.log(queryServerReg.exec(message.content));

            if(queryServerReg.test(message.content)){

                const result = queryServerReg.exec(message.content);

                this.query.getServer(result[1], parseInt(result[2]), message.channel);

            }
        });

        this.client.login(config.token);
    }
}

module.exports = Bot;