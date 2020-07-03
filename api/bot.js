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

    insertServer(ip, port){

        /**
         * name TEXT NOT NULL,
        alias TEXT NOT NULL,
        ip TEXT NOT NULL,
        real_ip TEXT NOT NULL,
        port INTEGER NOT NULL,
        gametype TEXT NOT NULL,
        map TEXT NOT NULL,
        current_players INTEGER NOT NULL,
        max_players INTEGER NOT NULL,
        added INTEGER NOT NULL,
        modified INTEGER NOT NULL
         */

        const alias = "Server "+Date.now();

        const now = Math.floor(Date.now() * 0.001);

        return new Promise((resolve, reject) =>{

            const query = "INSERT INTO servers VALUES('Another UT2004 Server',?,?,?,?,'Gametype', 'DM-Test',0,0,?,?)";

            db.run(query, [alias, ip, ip, port, now, now], (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    bServerAlreadyAdded(ip, port){

        return new Promise((resolve, reject) =>{

            const query = "SELECT COUNT(*) as total_servers FROM servers WHERE ip=? AND port=?";

            db.get(query, [ip, port], (err, row) =>{

                if(err){
                    //console.log(err);
                    reject(err);
                }else{
                    //console.log(row);
                    resolve(row);
                }
            });
        });
               
    }

    async addServer(message){

        try{
            const reg = /^.addserver (.+?)(:{0,1})(\d{0,5})$/i;

            const result = reg.exec(message.content);

            let ip = '';
            let port = 0;

            if(result != null){

                console.log(result);

                //port not specified set it to 7777
                if(result[2] === ":"){
                    port = parseInt(result[3]);
                    ip = result[1];
                }else{
                    ip = result[1] + result[3];
                    port = 7777;
                }

                const test = await this.bServerAlreadyAdded(ip, port);

                if(test.total_servers > 0){
                    //console.log("Server already added");
                    message.channel.send("That server has already been added to the database.");
                }else{
                    console.log("I can add that");

                    await this.insertServer(ip, port);
                }

                console.log("test = ");
                console.log(test);
                console.log(`Addserver ${ip}:${port}`);
            }else{
                console.log("result is null");
            }
        }catch(err){
            console.trace(err);

            message.channel.send("There was a database error, failed to added server.");
        }
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

            console.log(this.bUserAdmin(message));

            console.log(message.content);

            const queryServerReg = /^.q (.+?):{0,1}(\d{1,5})$/i;

            console.log(queryServerReg.exec(message.content));

            if(queryServerReg.test(message.content)){

                const result = queryServerReg.exec(message.content);

                this.query.getServer(result[1], parseInt(result[2]), message.channel);

            }else if(message.content == ".servers"){

                this.listServers(message);
                

            }else if(message.content.startsWith(".addserver ")){

                this.addServer(message);
            }

            //if(message.content == "potato"){
            //    this.query.getServerBasic();
            //}

            

        });

        this.client.login(config.token);
    }
}

module.exports = Bot;