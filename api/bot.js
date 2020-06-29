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
        this.totalPlayerPackets = 0;

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
                return;
            }
        }
    }

    createTeamString(players, team, teamScore){

        let string = "";
        let title = "";

        switch(team){
            case -1: {   string = ":eye: **Spectators:** "; } break;
            case 0: {   title = `:red_square: Red Team ${teamScore}\n`; } break;
            case 1: {   title = `:blue_square: Blue Team ${teamScore}\n`; } break;
        }

        const flagReg = /^.+\(([A-Z]{2})\)$/i;

        let p = 0;

        let flagResult = "";

        let bDisplayedFlag = false;

        for(let i = 0; i < players.length; i++){

            //console.log(i);

            p = players[i];

           // console.log(flagReg.exec(p.name));

            if(p.team == team || team === 'all'){
                //data.push(players[i]);
                //console.log(team);
                if(p.id === 0) continue;

                flagResult = flagReg.exec(p.name);

                if(flagResult != null){

                    bDisplayedFlag = true;

                    if(flagResult[1] == "UK"){
                        flagResult[1] = "gb";
                    }

                    string += `:flag_${flagResult[1].toLowerCase()}: `;

                    if(flagResult[1] == "gb"){
                        flagResult[1] = "UK";
                    }

                    p.name = p.name.replace(`(${flagResult[1]})`,'');
                }else{

                   // if(bDisplayedFlag){
                        string += `:pirate_flag:`;
                    //}
                }

                if(p.team != -1 || team === 'all'){
                    string += `${p.name}    **${p.score}**\n`;
                }else{
                    string += `${p.name} `;
                }
            }
        }

        if(string == "**Spectators:** "){
            string += "There are currently no spectators.";
        }

        if(string == ""){
            string = ":zzz: None";
        }

        return {"string": string, "title": title};
    }

    getScore(players, name){ 

        let p = 0;

        for(let i = 0; i < players.length; i++){

            p = players[i];

            if(p.name === name){
                if(p.id === 0 && p.team === -1){
                    return p.score;
                }
            }
        }

        return null;
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


        let result = this.getScore(players, targetName);

        if(result != null){
            return result
        }

        switch(team){

            case 0: { targetName = "West Side"; } break;
            case 1: { targetName = "East Side"; } break;
        }

        result = this.getScore(players, targetName);

        if(result != null){
            return result;
        }

        return '';
    }

    bDM(players){

        const teams = [];

        for(let i = 0; i < players.length; i++){

            if(teams.indexOf(players[i].team) == -1){
                teams.push(players[i].team);
            }
        }

        if(teams.length >= 2){
            return false;
        }

        return true;

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

                    this.pendingMessages.push(
                        {
                            "timeStamp": Date.now(),
                            "type": "players",
                            "ip": data.ip,
                            "port": data.port,
                            "channel": test.channel
                        }
                    );
                    this.query.pingServerPlayerInfo(data.ip, data.port);
                    
                }
            }


            this.query.em.on('playersPing', (data, ip, port) =>{

                //console.log('playersPing');
               // console.log(data);

                

                const test = this.getPendingMessage(ip, port, "players");

                console.log("Looking for "+ip+":"+port+" players");
                console.table(this.pendingMessages);
                console.log("test = "+test);

                //console.log(test);
               // console.log(this.currentServerInfo);

                //console.table(this.pendingMessages);

                if(test != null){

                    console.log("TEST NOT NULL");
                    console.log("TEST NOT NULL");
                    console.log("TEST NOT NULL");
                    console.log("TEST NOT NULL");
                    console.log("TEST NOT NULL");
                    console.log("TEST NOT NULL");
                    console.log("TEST NOT NULL");
                    console.log("TEST NOT NULL");
                    console.log("TEST NOT NULL");
                    console.log("TEST NOT NULL");
                    console.log("TEST NOT NULL");
                    console.log("TEST NOT NULL");

                    if(this.currentServerInfo.name != undefined){

                        this.totalPlayerPackets++;
                        const si = this.currentServerInfo;

                        console.log("######################################");
                        console.table(data);
                        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
                        console.table(this.currentPlayers);

                        if(data.length < si.currentPlayers){

                            if(this.totalPlayerPackets < 2){
                                this.currentPlayers = data;
                                return;
                            }else{
                                data = this.currentPlayers.concat(data);
                            }
                        }


                        let fields = [];

                        //data = this.currentPlayers;

                        //data = this.currentPlayers;

                       // data = this.currentPlayers.concat(data);

                        if(!this.bDM(data)){

                            const redTeamScore = this.getTeamScore(data, 0);
                            const blueTeamScore = this.getTeamScore(data, 1);

                            const redTeamString = this.createTeamString(data, 0, redTeamScore);
                            const blueTeamString = this.createTeamString(data, 1, blueTeamScore);
                            const spectatorsString = this.createTeamString(data, -1);

                            fields = [
                                {"name": redTeamString.title, "value": redTeamString.string, "inline": true},
                                {"name": blueTeamString.title, "value": blueTeamString.string, "inline": true},
                                {"name": '\u200B', "value": spectatorsString.string, "inline": false}
                            ];

                         //   console.log(redTeamString.string);
                         //   console.log(blueTeamString.string);
                          //  console.log(spectatorsString.string);

               
                        }else{

                            const dmPlayers = this.createTeamString(data, 'all','');
                            //console.log("DM PLAYERS");
                           // console.log(dmPlayers);

                            fields = [
                                {"name": "Players", "value": dmPlayers.string, "inline": true}
                            ];
                        }

                        
                       // string += '\n`'+playersString+'`'
                        //test.channel.send(string);

                        /*this.deletePendingMessage(ip, port, "players");
                        this.currentServerInfo = [];
                        this.currentPlayers = [];
                        this.totalPlayerPackets = 0;*/
                        //this.pendingMessages = [];

                        const embed = new Discord.MessageEmbed()
                        .setColor("#000000")
                        .setTitle(`${si.name}`)
                        .setDescription(`**Players ${si.currentPlayers}/${si.maxPlayers}**\n**${si.gametype}**\n**${si.map}**`)
                        .addFields(fields)
                        .setFooter(`ut2004://${ip}:${port}`);

                        test.channel.send(embed).then(() =>{
                            
          
                            console.log("Deleted pening message");
                        }).catch((err) =>{
                            console.log(err);
                        });

                    }else{

                        console.log("CURRENT SERVER NAME IS NULLL");
                        console.log("CURRENT SERVER NAME IS NULLL");
                        console.log("CURRENT SERVER NAME IS NULLL");
                        console.log("CURRENT SERVER NAME IS NULLL");
                        console.log("CURRENT SERVER NAME IS NULLL");
                        console.log("CURRENT SERVER NAME IS NULLL");
                        console.log("CURRENT SERVER NAME IS NULLL");
                    }

                }else{
                    console.log("NULLLLLLLLLLLLLLL");
                    console.log("NULLLLLLLLLLLLLLL");
                    console.log("NULLLLLLLLLLLLLLL");
                    console.log("NULLLLLLLLLLLLLLL");
                    console.log("NULLLLLLLLLLLLLLL");
                    console.log("NULLLLLLLLLLLLLLL");
                    console.log("NULLLLLLLLLLLLLLL");
                    console.log("NULLLLLLLLLLLLLLL");
                    console.log("NULLLLLLLLLLLLLLL");
                    console.log("NULLLLLLLLLLLLLLL");
                    console.log("NULLLLLLLLLLLLLLL");
                    console.log("NULLLLLLLLLLLLLLL");
                    console.log("NULLLLLLLLLLLLLLL");
                }
                this.deletePendingMessage(ip, port, "players");
                this.currentServerInfo = [];
                this.currentPlayers = [];
                this.totalPlayerPackets = 0;
                
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

            this.totalPlayerPackets = 0;

            this.query.pingServerBasic(ip, port);
            

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