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

    forceStringLength(string, targetLength){

        if(string.length > targetLength){

           string = string.slice(0, targetLength);

        }else{

            while(string.length < targetLength){
                string += " ";
            }
        }

        return string;
    }

    createServerString(id, data){

        id = parseInt(id + 1);

        if(id != id){

            id = "ID";

        }else{

            if(id < 10){
                id = id+" ";
            }

        }

        let string = "";

        const idLength = 4;
        const aliasLength = 20;
        const mapLength = 20;
        

        data.alias = this.forceStringLength(data.alias, aliasLength);
        data.map = this.forceStringLength(data.map, mapLength);

        data.current_players = parseInt(data.current_players);
        data.max_players = parseInt(data.max_players);

        let playersString = `${data.current_players}/${data.max_players}`;

        if(data.current_players != data.current_players){
            playersString = "Players";
        }

        playersString = this.forceStringLength(playersString, 7);

        
        string = `\`${id} - ${data.alias} ${data.map} ${playersString}\`\n`;

        return string;
    }

    listServers(message){

        const query = `SELECT * FROM servers ORDER BY added ASC`;

        const servers = [];

        db.each(query, (err, row) =>{

            if(err) console.trace(err);
            console.log(row);

            servers.push(row);

        }, (err, totalRows) =>{

            if(err){
                console.trace(err);
            }

            console.log(`Fetched ${totalRows} rows`);

            let serverString = "";

            let s = "";

            for(let i = 0; i < servers.length; i++){

                serverString += this.createServerString(i, servers[i]);
        
            }

            let embed = new Discord.MessageEmbed()
            .setColor("#000000")
            .setTitle("Unreal Tournament 2004 Servers")
            .setDescription("Use `.q serverid` for more information on a server.")
            .addField(this.createServerString("ID", {"alias": "Server Alias", "map": "Map", "current_players": "Play", "max_players": "ers"}), serverString);


            message.channel.send(embed);

        })
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

                return;
            }

            if(message.content == "potato"){
                this.query.getServerBasic();
            }

            if(message.content == ".servers"){
                this.listServers(message);
            }

        });

        this.client.login(config.token);
    }
}

module.exports = Bot;