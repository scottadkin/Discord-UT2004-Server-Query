const Promise = require('promise');
const config = require('./config');
//const db = require('./database');
const dns = require('dns');


class Servers{

    constructor(db){

        this.db = db;
    }

    getIp(ip){

        return new Promise((resolve, reject) =>{

           // console.log("GET IPPPPPPPPPPPPPPPPPPPPPPPPPPPP");
            const ipReg = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/i;

            if(ipReg.test(ip)){
                resolve(ip);
            }

            dns.lookup(ip, (err, address, family) =>{

               // console.log("INSIDE DNS>LOOKUP");
                if(err){
                    reject(err);
                }

                console.log("address = "+address);
                console.log("family = "+family);

                resolve(address);
            });

        });
        
    }

    insertServer(ip, realIp, port, alias){

        const now = Math.floor(Date.now() * 0.001);   

        return new Promise((resolve, reject) =>{

            const query = "INSERT INTO servers VALUES('Another UT2004 Server',?,?,?,?,'Gametype', 'N/A',0,0,?,?)";

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

        console.log("update server");
        console.log(data);
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

            const self= this;

            this.db.run(query, vars, function (err){

                if(err) reject(err);

                console.log(this);

                if(this.changes === 0){

                    self.db.run(altQuery, vars, (err) =>{
                        if(err) console.log(err);
                    });

                }else{

                    resolve();
                }
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