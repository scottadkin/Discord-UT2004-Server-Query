const sqlite3 = require('sqlite3').verbose();
const Discord = require('discord.js');
const UT2004Query = require('./ut2004query');
const config = require('./config');


const db = new sqlite3.Database(config.dbFile, sqlite3.OPEN_READWRITE, (err) =>{

    if(err){
        console.trace(err);
        return;
    }

   // db.run("DELETE FROM ut_servers", (err) =>{
      //  if(err) console.log(err);
  //  });
        console.log("Connected to database");
});

class Bot{

    constructor(){

        this.createClient();
        this.query = new UT2004Query();

        this.pendingMessages = [];

        this.currentServerInfo = [];
        this.currentPlayers = [];

        this.addListeners();
        
    }

    updateServerDetails(data){

        db.serialize(() =>{

            /**
         * 
         * name TEXT NOT NULL,
        alias TEXT NOT NULL,
        ip TEXT NOT NULL,
        real_ip TEXT NOT NULL,
        port INTEGER NOT NULL,
        password TEXT NOT NULL,
        country TEXT NOT NULL,
        created INTEGER NOT NULL,
        modified INTEGER NOT NULL,
        current_players INTEGER NOT NULL,
        max_players INTEGER NOT NULL,
        map TEXT NOT NULL,
        gametype TEXT NOT NULL,
        gloalscore INTEGER NOT NULL,
        time_limit INTEGER NOT NULL
         */


            const now = Math.floor(Date.now() * 0.001);

            const existQuery = `SELECT COUNT(*) as total_servers FROM ut_servers WHERE ip=? AND port=?`;

            const deleteQuery = `DELETE FROM ut_servers WHERE ip=? AND port=?`;

            const insertQuery = `INSERT INTO ut_servers VALUES(?,'alias',?,?,?,'password','xx',?,?,?,?,?,?,0,0)`;

            const insertVars = [
                data.name,
                data.ip,
                data.ip,
                data.port,
                now, 
                now,
                data.currentPlayers,
                data.maxPlayers,
                data.map,
                data.gametype
            ];

            const updateQuery = `UPDATE ut_servers SET name=?, modified=?, current_players=?, max_players=?, map=?, gametype=? WHERE ip=? AND port=?`;

            const updateVars = [
                data.name,
                now,
                data.currentPlayers,
                data.maxPlayers,
                data.map,
                data.gametype,
                data.ip,
                data.port
            ];

            db.get(existQuery, [data.ip, data.port], (err, row) =>{

                if(err){
                    console.log(err);
                    return;
                }

                console.log(row);

                if(row.total_servers > 0){

                    db.run(updateQuery, updateVars, (err) =>{
                        if(err) console.log(err);
                    }); 
                }else{
                    db.run(insertQuery, insertVars, (err) =>{
                        if(err) console.log(err);
                    });
                }

            });      
        });

    }

    getPendingMessage(ip, port, type){

        let p = 0;

        for(let i = 0; i < this.pendingMessages.length; i++){

            p = this.pendingMessages[i];

            if(p.ip === ip && p.port === port && p.type === type){
                return p;
            }
        }

        return null;
    }

    deletePendingMessage(ip, port, type){

        let p = 0;

        for(let i = 0; i < this.pendingMessages.length; i++){

            p = this.pendingMessages[i];

            if(p.ip === ip && p.port === port && p.type === type){
                this.pendingMessages.splice(i, 1);
            }
        }
    }

    createTeamString(players, team, teamScore){

        let string = "";
        let title = "";

        switch(team){
            case -1: {   string = "**Spectators:** "; } break;
            case 0: {   title = `Red Team ${teamScore}\n`; } break;
            case 1: {   title = `Blue Team ${teamScore}\n`; } break;

        }

        let p = 0;

        for(let i = 0; i < players.length; i++){

            p = players[i];

            if(p.team == team){
                //data.push(players[i]);

                if(p.id === 0) continue;
                if(p.team != -1){
                    string += `${p.name}    ${p.score}\n`;
                }else{
                    string += `${p.name} `;
                }
            }
        }

        return {"string": string, "title": title};
    }

    getTeamScore(players, team){


        if(team !== 0 && team !== 1){
            return '';
        }

        let targetName = "";

        switch(team){

            case 0: { targetName = "Red Team"; } break;
            case 1: { targetName = "Blue Team"; } break;
        }

        let p = 0;

        for(let i = 0; i < players.length; i++){

            p = players[i];

            if(p.name === targetName){
                if(p.id === 0 && p.team === -1){
                    return p.score;
                }
            }
        }

        return '';
    }

    addListeners(){
        
        this.query.em.on('basicPing', (data) =>{

            console.log(`Got basic server information for ${data.ip}:${data.port}`);
            //console.log("test");


            this.updateServerDetails(data);

            if(this.channel != undefined){

                const test = this.getPendingMessage(data.ip, data.port, "basic");

                if(test != null){

                    this.currentServerInfo = data;
                    this.deletePendingMessage(data.ip, data.port, "basic");
                    
                }
            }


            this.query.em.on('playersPing', (data, ip, port) =>{

                //console.log('playersPing');
               // console.log(data);

                const test = this.getPendingMessage(ip, port, "players");

                //console.log(test);
               // console.log(this.currentServerInfo);

                //console.table(this.pendingMessages);

                if(test != null){

                    

                    if(this.currentServerInfo.name != undefined){

                        //test.channel.send("Players stufff");
                        const si = this.currentServerInfo;

                        if(data.length < si.currentPlayers){

                            console.log("Player length not enoguh");

                            this.currentPlayers = this.currentPlayers.concat(data);

                            if(this.currentPlayers.length < si.currentPlayers){        
                                console.log("Not enough player data yet waiting for second packet");
                                return;
                            }
                        }else{
                            this.currentPlayers = data;
                        }
 

                        let string = `${si.name} (${ip}:${port})
Playing ${si.gametype} on ${si.map}
Players ${si.currentPlayers}/${si.maxPlayers}`;


                        let playersString = "";

                        let d = 0;

                        //data = this.currentPlayers;

                       // data = this.currentPlayers.concat(data);

                        const redTeamScore = this.getTeamScore(data, 0);
                        const blueTeamScore = this.getTeamScore(data, 1);

                        const redTeamString = this.createTeamString(data, 0, redTeamScore);
                        const blueTeamString = this.createTeamString(data, 1, blueTeamScore);
                        const spectatorsString = this.createTeamString(data, -1);

                        console.log(redTeamString.string);
                        console.log(blueTeamString.string);
                        console.log(spectatorsString.string);

                        string += '\n`'+playersString+'`'
                        //test.channel.send(string);


                        const embed = new Discord.MessageEmbed()
                        .setColor("#000000")
                        .setTitle(`${si.name}`)
                        .setDescription(`**Players ${si.currentPlayers}/${si.maxPlayers}**\n**${si.gametype}**\n**${si.map}**`)
                        .addField(redTeamString.title, redTeamString.string, true)
                        .addField(blueTeamString.title, blueTeamString.string, true)
                        .addField('\u200B', spectatorsString.string, false)
                        .setFooter(`ut2004://${ip}:${port}`);

                        test.channel.send(embed);

                     
                        this.deletePendingMessage(ip, port, "players");
                        this.currentServerInfo = [];
                        this.currentPlayers = [];

                        //const embed = new Discord.embed();

                        


                        
                    }
                }
            });

            
        });
    }

    customQueryServer(message){

        const reg = new RegExp(`^${config.commandPrefix}q (.+?)(:{0,1})(\\d{0,5})$`,"i");
        //const reg = /^.q (.+?)(:{0,1})(\d{0,5})$/i
        const result = reg.exec(message.content);

        if(result != null){

            if(result[2] == '' && result[3] == ''){
                message.channel.send(`Error: Wrong syntax for server query, correct is \`${config.commandPrefix}q <server ip>:<port>\` port being optional for default port.`);
                return;
            }

            let ip = result[1];

            let port = 7777;

            if(result[3] != ''){
                port = parseInt(result[3]);
            }

            if(result[2] == ''){
                ip += result[3];
                port = 7777;
            }

           // console.log(result);

            if(port < 0 || port > 65536){
                message.channel.send(`Error: Server port must be in range of 0 - 65536`);
                return;
            }

            console.log(`${ip}:${port}`);

            this.pendingMessages.push(
                {
                    "timeStamp": Date.now(),
                    "type": "basic",
                    "ip": ip,
                    "port": port,
                    "channel": message.channel
                }
            );

            this.pendingMessages.push(
                {
                    "timeStamp": Date.now(),
                    "type": "players",
                    "ip": ip,
                    "port": port,
                    "channel": message.channel
                }
            );

            this.query.pingServerBasic(ip, port);
            this.query.pingServerPlayerInfo(ip, port);

            return;
        }
        

        //console.log(result);

    }

    createClient(){

        this.client = new Discord.Client();

        this.client.on('ready', () =>{
            console.log("Logged into discord");
        });

        this.client.on('error', (err) =>{
            console.trace(err);
        });

        this.client.on('message', (message) =>{
            console.log(message.content);

            this.channel = message.channel;

            if(message.content == "test"){
                
                this.pendingMessages.push(
                    {
                        "timeStamp": Date.now(),
                        "type": "basic",
                        "ip": '80.4.151.145',
                        "port": 7777,
                        "channel": message.channel
                    }
                );

                this.currentServerInfo = [];
                this.currentPlayers = [];
                this.query.pingServerBasic('80.4.151.145', 7777);     

            }else if(message.content.startsWith(config.commandPrefix)){
                this.currentServerInfo = [];
                this.currentPlayers = [];
                this.customQueryServer(message);
            }
        });


        this.client.login('');
    }
}


module.exports = Bot;