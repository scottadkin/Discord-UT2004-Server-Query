const Promise = require('promise');
const config = require('./config.json');


class Roles{

    constructor(db){

        this.db = db;
    }


    getAllAddedRoles(){

        return new Promise((resolve, reject) =>{

            const roles = [];

            const query = "SELECT * FROM roles";

            this.db.each(query, (err, result) =>{

                if(err) reject(err);

                roles.push(result);

            }, (err) =>{

                if(err) reject(err);

                resolve(roles);
            });
        });
    }


    deleteRole(id){

        return new Promise((resolve, reject) =>{

            const query = 'DELETE FROM roles WHERE id=?';

            this.db.run(query, [id], (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    bRoleAlreadyAdded(id){

        return new Promise((resolve, reject) =>{

            const query = "SELECT COUNT(*) as total_roles FROM roles WHERE id=?";

            this.db.get(query, [id], (err, result) =>{

                if(err) reject(err);

                if(result !== undefined){

                    if(result.total_roles > 0){
                        resolve(true);
                    }
                }

                resolve(false);
            });
        });
    }

    insertRow(id){

        return new Promise((resolve, reject) =>{

            const now = Math.floor(Date.now() * 0.001);

            const query = "INSERT INTO roles  VALUES(?,?)";

            this.db.run(query, [id, now], (err) =>{

                if(err) reject(err)

                resolve();
            });
        });
    }

    async addRole(id, name, channel){

        try{

            if(!await this.bRoleAlreadyAdded(id)){

                await this.insertRow(id);

                channel.send(`${config.passIcon} Users with the role **${name}** can now use admin commands.`);

            }else{
                channel.send(`${config.failIcon} That role already has admin privileges.`);
            }

        }catch(err){
            console.trace(err);
        }
    }


    bRoleExists(text, channel){
 
        const roles = channel.guild.roles.cache;

        text = text.toLowerCase();

        const roleExist = ((elem) =>{

            if(elem.name.toLowerCase() === text) return true;

            return false;

        });

        if(roles.some(roleExist)){

            return true;

        }   

        return false;
    }

    getRoleId(name, channel){

        const roles = channel.guild.roles.cache.array();

        name = name.toLowerCase();

        for(let i = 0; i < roles.length; i++){

            if(roles[i].name.toLowerCase() === name){
                return roles[i].id;
            }
        }

        return null;

    }

    getRoleName(id, channel){

        const roles = channel.guild.roles.cache.array();

        for(let i = 0; i < roles.length; i++){

            if(roles[i].name.toLowerCase() === id){
                return roles[i].name;
            }
        }

        return null;
    }

    async displayAddedRoles(channel){

        try{

            const roles = await this.getAllAddedRoles();

            let string = `**Roles that have admin privileges:**\n`;

            string += `${config.defaultAdminRole}`;

            let currentRoleName = '';

            for(let i = 0; i < roles.length; i++){

                currentRoleName = this.getRoleName(roles[i].id, channel);

                if(currentRoleName === null){
                    currentRoleName = `:warning: Deleted Role`;
                }

                string += `**,** ${currentRoleName}`;
            }

            channel.send(`${string}.`);

        }catch(err){
            console.trace(err);
        }
    }
}

module.exports = Roles;