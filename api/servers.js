

const Promise = require('promise');
const config = require('./config');
const Database = require('./database');
const dns = require('dns');


class Servers{

    constructor(db){
        this.db = db;
    }

    getIp(ip){

        return new Promise((resolve, reject) =>{

            const ipReg = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/i;

            if(ipReg.test(ip)){
                resolve(ip);
            }

            dns.lookup(ip, (err, address) =>{

                if(err){
                    reject(err);
                }

                resolve(address);
            });

        });
        
    }

    insertServer(ip, realIp, port, alias){

        const now = Math.floor(Date.now() * 0.001);   

        return new Promise((resolve, reject) =>{

            const query = "INSERT INTO servers VALUES('Another UT2004 Server',?,?,?,?,'Gametype','N/A',0,0,?,?,-1,-1)";

            if(realIp === ip){
                realIp = "";
            }

            this.db.run(query, [alias, ip, realIp, port, now, now], (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    bServerAlreadyAdded(ip, port){

        return new Promise((resolve, reject) =>{

            const query = "SELECT COUNT(*) as total_servers FROM servers WHERE ip=? AND port=?";

            this.db.get(query, [ip, port], (err, row) =>{

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

    getAllServers(){

        return new Promise((resolve, reject) =>{

            const query = `SELECT * FROM servers ORDER BY added ASC`;

            const servers = [];
            
            this.db.each(query, (err, row) =>{

                if(err) reject(err);

                servers.push(row);

            }, (err) =>{

                if(err){
                    reject(err);
                }

                resolve(servers);
            });
        });
    }

    updateServer(data){

        //console.log("update server");
        //console.log(data);

        return new Promise((resolve, reject) =>{

            const query = "UPDATE servers SET name=?,gametype=?,map=?,current_players=?,max_players=?,modified=? WHERE ip=? AND port=?";
            const altQuery = "UPDATE servers SET name=?,gametype=?,map=?,current_players=?,max_players=?,modified=? WHERE real_ip=? AND port=?";

            const now = Math.floor(Date.now() * 0.001);

            if(data.name == ""){
                data.name = "Another UT2004 Server";
            }

            if(data.gametype == ""){
                data.gametype = "Not Found";
            }

            if(data.map == ""){
                data.map = "N/A";
            }
            
            const vars = [data.name, data.gametype, data.map, data.currentPlayers, data.maxPlayers, now, data.ip, data.port];

            //const self= this;

            this.db.run(query, vars, function (err){

                if(err) reject(err);

               // console.log(this);

                if(this.changes === 0){

                    this.db.run(altQuery, vars, (err) =>{
                        if(err) console.log(err);
                    });

                }else{

                    resolve();
                }
            });
        });
    }


    /*deleteAutoServerMessage(){

        return new Promise((resolve, reject) =>{

            resolve();
        });
    }*/

    deleteServer(ip, port){


        return new Promise((resolve, reject) =>{

            const query = "DELETE FROM servers WHERE ip=? AND port=?";

            this.db.run(query, [ip, port], (err) =>{

                if(err) reject(err);

                resolve();
            });

        });
    }


    setServerMessageId(ip, port, messageId, channelId){

        return new Promise((resolve, reject) =>{

            const query = "UPDATE servers SET message_id=?, channel_id=? WHERE ip=? AND port=?";

            this.db.run(query, [messageId, channelId, ip, port], (err) =>{

                if(err) reject(err);

               // console.log(`"UPDATE servers SET message_id=${messageId}, channel_id=? WHERE ip=${ip} AND port=${port}"`);

                resolve();
            });
        });
    }

    getServerLastMessageId(ip, port){

        return new Promise((resolve, reject) =>{

            const query = "SELECT message_id FROM servers WHERE ip=? AND port=? AND channel_id=?";

            this.db.get(query, [ip, port], (err, row) =>{

                if(err) reject(err);

                resolve(row);
            });
        });
    }


    resetAutoChannel(){

        return new Promise((resolve, reject) =>{

            const query = "UPDATE channels set auto_query=0";

            this.db.run(query, (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    setAutoChannel(channel){

        return new Promise((resolve, reject) =>{

            const query = "UPDATE channels SET auto_query=1 WHERE channel_id=?";

            //console.log(`"UPDATE channels SET auto_query=1 WHERE channel_id=${channel}"`);

            this.db.run(query, [channel], function (err){

                if(err) reject(err);

                let changes = 0;

                if(this.changes != undefined){
                    changes = this.changes;
                }

               // console.log(this);

                if(changes === 0){
                    resolve(false);
                }else{
                    resolve(true);
                }
            });
        });
    }

    removePreviousMessageIds(){

        return new Promise((resolve, reject) =>{

            const query = "UPDATE servers SET message_id=-1";

            this.db.run(query, (err) =>{

                if(err) reject(err);

                resolve();
            })
        });
    }

    async changeAutoChannel(message){

        try{

            await this.resetAutoChannel();
            
            await this.removePreviousMessageIds();

            const result = await this.setAutoChannel(message.channel.id);

            if(result){
                message.channel.send(`Auto query channel set to **${message.channel.name}**. Data will be posted shortly.\nAuto update interval is set to ${config.autoQueryInterval} seconds.`);
            }else{
                //console.log("Failed to change update channel");
                message.channel.send(`Failed to change auto query channel. This could be because the bot has not been enabled to post in the current channel.`);
            }

        }catch(err){
            console.trace(err);
        }   
    }


    getAutoChannel(){

        return new Promise((resolve, reject) =>{

            const query = "SELECT channel_id FROM channels WHERE auto_query=1";

            this.db.get(query, (err, row) =>{

                if(err) reject(err);

                if(row === undefined){
                    resolve(null);
                }else{
                    resolve(row.channel_id);
                }
            });
        });
    }

    getAutoQueryMessageid(ip, port){

        return new Promise((resolve, reject) =>{

            const query = "SELECT message_id FROM servers WHERE ip=? AND port=?";

            this.db.get(query, [ip, port], (err, row) =>{

                if(err) reject(err);

                if(row === undefined){
                    resolve(-1);
                }else{

                    resolve(row.message_id);
                }
            });
        });
    }


}


module.exports = Servers;