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

    addListeners(){
        

        this.query.em.on('basicPing', (data) =>{

            console.log(`Got basic server information for ${data.ip}:${data.port}`);
            //console.log("test");


            this.updateServerDetails(data);

            if(this.channel != undefined){

                const test = this.getPendingMessage(data.ip, data.port, "basic");

                if(test != null){

                    this.currentServerInfo = data;

                    test.channel.send(`
                        ${data.name}
                        ${data.ip}:${data.port}
                        Players: ${data.currentPlayers}/${data.maxPlayers}
                        Gametype: ${data.gametype}
                        Map: ${data.map}
                    `);

                    this.deletePendingMessage(data.ip, data.port, "basic");
                    
                }
            }


            this.query.em.on('players', (data) =>{

                console.log(data);
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

            console.log(result);

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
                this.query.pingServerBasic('80.4.151.145', 7777);     

            }else if(message.content.startsWith(config.commandPrefix)){
                this.currentServerInfo = [];
                this.customQueryServer(message);
            }
        });


        this.client.login('');
    }
}


module.exports = Bot;