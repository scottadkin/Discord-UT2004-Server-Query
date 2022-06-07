const { defaultServerPort, queryPrefix, regErrorMessage } = require("../config.json");
const db = require("./database");
const Functions = require("./functions");
const Message = require("./message");

const dns = require("node:dns").promises;

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
        

            let port = defaultServerPort;

            const reg = /^addserver (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:(\d{1,5})|.*?)(| (.*))$/i;

            const result = reg.exec(command);

            if(result === null){
                
                const text = "Incorrect syntax for addserver command.";
                const errorMessage = new Message("error", discordChannel, "Failed to update server list.", text);
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
            if(result[5] !== undefined){

                serverName = result[5];
            }

            if(!Functions.bValidIp(`${ip}:${port}`)){

                const text = `:white_small_square: You have not specified a valid ip:port combination. If you have not specified a port a default value of ${defaultServerPort} is used.`;
                const errorMessage = new Message("error", discordChannel, "Failed to update server list.", text);
                await errorMessage.send();
                return;
            }


            if(await this.bServerAlreadyAdded(ip, port)){

                const text = `:white_small_square: A server with the ip:port combination of ${ip}:${port} is already in the database.
                :white_small_square: You can delete the entry with the **${queryPrefix}delete <serverId>** command then replace it.
                :white_small_square: You can edit the entry with the **${queryPrefix}edit <serverId> <ip:port> <serverName>** command.`;
                const errorMessage = new Message("error", discordChannel, "Failed to update server list.", text);
                await errorMessage.send();
                return;
            }

            const now = Math.floor(Date.now() * 0.001);

            const stmt = db.prepare(`INSERT INTO servers VALUES(?,?,?,?,0,0)`, async (err) =>{

                if(err){
                    console.trace(err);
                    return;
                }

                const passText = `:white_small_square: Added server ${ip}:${port} to server list.`;
                const passMessage = new Message("pass", discordChannel, "Added server successfully", passText);
                await passMessage.send();

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


    getServerByIndex(id){

        return new Promise((resolve, reject) =>{

            id = id - 1;

            const query = `SELECT ip,port,added FROM servers ORDER BY added ASC LIMIT ?, 1`;

            db.all(query, [id], (err, result) =>{

                if(err){
                    reject(err);
                    return;
                }

                if(result.length === 0){
                    reject(`:white_small_square: There is no server with the index of ${id + 1}.`);
                    return;
                }

                resolve(result[0]);

            });

        });
    }


    deleteServerQuery(ip, port, added){

        return new Promise((resolve, reject) =>{

            const query = "DELETE FROM servers WHERE ip=? AND port=? AND added=?";

            db.run(query, [ip, port, added], function(err){

                if(err){
                    reject(err);
                    return;
                }

                if(this.changes > 0){

                    resolve(true);
                    return;

                }else{
                    resolve(false);
                    return;
                }
            });
        });
    }

    async deleteServer(command, discordChannel){

        const errorTitle = "Failed to delete server.";
        let errorText= "";

        try{

            const reg = /^deleteserver (\d+)$/i;

            const result = reg.exec(command);

            if(result === null){

                errorText = `:white_small_square: Incorect syntax, required is **${queryPrefix}deleteserver <serverid>**.
                :white_small_square: Use **${queryPrefix}list** to find a server's id.`;
                
            }else{

                const id = parseInt(result[1]);

                const serverDetails = await this.getServerByIndex(id);

                if(await this.deleteServerQuery(serverDetails.ip, serverDetails.port, serverDetails.added)){

                    const passText = `:white_small_square: Removed server ${serverDetails.ip}:${serverDetails.port} from the server list.`;

                    const passMessage = new Message("pass", discordChannel, "Server deleted successfully", passText);
                    await passMessage.send();

                }else{
                    errorText = `:white_small_square: No servers were deleted from the table.`;
                }
            }


            if(errorText !== ""){
                const errorMessage = new Message("error", discordChannel, errorTitle, errorText);
                await errorMessage.send();
            }

        }catch(err){
            
            const errorMessage = new Message("error", discordChannel, errorTitle, err.message ?? err);
            await errorMessage.send()
        }
    }

    debugDisplayDatabase(){

        return new Promise((resolve, reject) =>{

            const query = "SELECT * FROM servers ORDER BY added ASC";

            db.all(query, (err, result) =>{

                if(err){
                    console.trace(err);
                    reject(err);
                    return;
                }

                resolve();

            });

        });   
    }

    queryByIP(command, discordChannel, ut2k4Query){


        return new Promise(async (resolve, reject) =>{

            const ipReg = /^q (.+)$/i;

            const regResult = ipReg.exec(command);

            if(regResult !== null){

                if(Functions.bValidIp(regResult[1])){

                    const parts = regResult[1].split(":");

                    const port = (parts.length < 2) ? defaultServerPort : parseInt(parts[1]);
                    const ip = parts[0];

                    ut2k4Query.fetchFullResponse(ip, port + 1, discordChannel);
                    resolve();
                    
                }else{


                    try{

                        const domainParts = Functions.splitDomainPort(regResult[1], defaultServerPort);

                        const test = await dns.lookup(domainParts.domain);

                        ut2k4Query.fetchFullResponse(test.address, domainParts.port + 1, discordChannel);
                        resolve();

                        //reject("test");
                        return;

                    }catch(err){

                        console.trace(err);
                        reject(`Not a valid IP:PORT combination, or domain.`);
                        return;
                    }
                   


                    //reject("Not a valid server ip:port combination.");
                    //return;
                }
                
            }else{
                reject("Not a valid server query.");
                return;
            }

        });

        

    }


    async queryServer(command, discordChannel, ut2k4Query){

        try{

            const indexReg = /^q(\d+)$/i;

            const result = indexReg.exec(command);

            if(result !== null){

                const serverDetails = await this.getServerByIndex(parseInt(result[1]));
                ut2k4Query.fetchFullResponse(serverDetails.ip, serverDetails.port + 1, discordChannel);

            }else{

                await this.queryByIP(command, discordChannel, ut2k4Query);
            }

        }catch(err){

            const errorMessage = new Message("error", discordChannel, "Failed to query server.", err.message ?? err);
            await errorMessage.send();
            //console.trace(err);
        }
    }
}

module.exports = Servers;