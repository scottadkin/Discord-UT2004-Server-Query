const { defaultServerPort, queryPrefix } = require("../config.json");
const db = require("./database");
const Functions = require("./functions");
const ErrorMessage = require("./errorMessage");

class Servers{

    constructor(){}


    bServerAlreadyAdded(ip, port){

        return new Promise((resolve, reject) =>{

            const query = "SELECT COUNT(*) as total_servers FROM servers WHERE ip=? AND port=?";

            db.get(query, [ip, port], (err, result) =>{

                if(err){
                    reject(err);
                    return;
                }

                if(result.total_servers > 0){
                    resolve(true);
                }else{
                    resolve(false);
                }

                return;
            });
        });
    }

    async addServer(command, discordChannel, ut2k4Query){

        try{
            
            let bUseServerName = false;

            let port = defaultServerPort;

            const reg = /^addserver (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:(\d{1,5})|.*?)(| (.*))$/i;

            const result = reg.exec(command);
            
            console.log(result);


            if(result === null){
                
                const text = `:white_small_square: Regular expression failed to match, in other words **Scott is an imbecile**.`;
                const errorMessage = new ErrorMessage(discordChannel, "Failed to update server list.", text);
                await errorMessage.send();
                return;
            }

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

            if(!Functions.bValidIp(`${ip}:${port}`)){

                const text = `:white_small_square: You have not specified a valid ip:port combination. If you have not specified a port a default value of ${defaultServerPort} is used.`;
                const errorMessage = new ErrorMessage(discordChannel, "Failed to update server list.", text);
                await errorMessage.send();
                return;
            }


            if(await this.bServerAlreadyAdded(ip, port)){

                const text = `:white_small_square: A server with the ip:port combination of ${ip}:${port} is already in the database.
                :white_small_square: You can delete the entry with the **${queryPrefix}delete <serverId>** command then replace it.
                :white_small_square: You can edit the entry with the **${queryPrefix}edit <serverId> <ip:port> <serverName>** command.`;
                const errorMessage = new ErrorMessage(discordChannel, "Failed to update server list.", text);
                await errorMessage.send();
                return;
            }

            const now = Math.floor(Date.now() * 0.001);

            const stmt = db.prepare(`INSERT INTO servers VALUES(?,?,?,?,0,0)`, (err) =>{

                if(err){
                    console.trace(err);
                    return;
                }

                console.log("OK");
            });

            stmt.run([serverName, ip, port, now]);

        }catch(err){

            console.trace(err);
        }

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