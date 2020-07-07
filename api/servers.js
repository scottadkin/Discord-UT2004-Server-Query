const Promise = require('promise');
const config = require('./config');
//const db = require('./database');


class Servers{

    constructor(db){

        this.db = db;
    }

    insertServer(ip, port){

        const alias = "Server "+Date.now();

        const now = Math.floor(Date.now() * 0.001);

        return new Promise((resolve, reject) =>{

            const query = "INSERT INTO servers VALUES('Another UT2004 Server',?,?,?,?,'Gametype', 'DM-Test',0,0,?,?)";

            this.db.run(query, [alias, ip, ip, port, now, now], (err) =>{

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

        return new Promise((resolve, reject) =>{

            const query = "UPDATE servers SET name=?,gametype=?,map=?,current_players=?,max_players=?,modified=? WHERE ip=? AND port=?";

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
            

            this.db.run(query, [data.name, data.gametype, data.map, data.currentPlayers, data.maxPlayers, now, data.ip, data.port], (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }


    deleteServer(ip, port){


        return new Promise((resolve, reject) =>{

            const query = "DELETE FROM servers WHERE ip=? AND port=?";

            this.db.run(query, [ip, port], (err) =>{

                if(err) reject(err);

                resolve();
            });

        });
    }

}


module.exports = Servers;