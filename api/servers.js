const { defaultServerPort } = require("../config.json");
const db = require("./database");
const Functions = require("./functions");

class Servers{

    constructor(){}

    addServer(command, ut2k4Query){

        let bUseServerName = false;

        let port = defaultServerPort;

        const reg = /^addserver (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:(\d{1,5})|.*?)(| (.*))$/i;

        const result = reg.exec(command);
        console.log(result);
        console.log(`Command is ${command}`);

        if(result === null) return;

        let ip = result[1];

        //no port
        if(result[3] !== undefined){

            port = parseInt(result[3]);
        }

        let serverName = "";

        //no name
        if(result[5] === undefined){

            bUseServerName = true;

        }else{

            serverName = result[5];
        }

        if(Functions.bValidIp(`${ip}:${port}`)){

            console.log("Good ip");

        }else{
            console.log("Bad ip");
        }

        console.log(`${ip}:${port} = ${serverName}`);

        /**
         * name TEXT NOT NULL,
        ip TEXT NOT NULL,
        port INTEGER NOT NULL,
        added INTEGER NOT NULL,
        edited INTEGER NOT NULL,
        times_edited INTEGER NOT NULL
         */

        const now = Math.floor(Date.now() * 0.001);

        const stmt = db.prepare(`INSERT INTO servers VALUES(?,?,?,?,0,0)`, (err) =>{

            if(err){
                console.trace(err);
                return;
            }

            console.log("OK");
        });

        stmt.run([serverName, ip, port, now]);

    }

    getPingList(){

        return new Promise((resolve, reject) =>{

            const query = "SELECT name,ip,port FROM servers ORDER BY added ASC";

            db.all(query, (err, results) =>{

                if(err){
                    console.trace(err);
                    reject(err);
                    return;
                }

                resolve(results);
            });
        });
   
    }

    debugDisplayDatabase(){

        const query = "SELECT * FROM servers ORDER BY added ASC";


        db.all(query, (err, result) =>{

            if(err){
                console.trace(err);
                return;
            }

            console.table(result);

        });

        //console.table(rows);

    }
}

module.exports = Servers;