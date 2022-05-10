const db = require("./database");
const Message = require("./message");
const {queryPrefix} = require("../config.json");

class Permissions{

    constructor(discordMessage){

        this.message = discordMessage;

    }

    splitDefaultCommand(message){

        const reg = /^.+? (.+)$/i;

        return reg.exec(message);
    }

    getDiscordRole(roleName){

        return this.message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    }

    async addRole(message){
  
        const result = this.splitDefaultCommand(message);

        if(result !== null){

            const roleName = result[1];

            const role = this.getDiscordRole(roleName);

            const errorTitle = "Failed to give role admin permissions";

            if(role === undefined){

                const text = `:white_small_square: There is no role called **${roleName}** in this server.`;
                const eMessage = new Message("error", this.message.channel, errorTitle, text);
                await eMessage.send();
                return;

            }else{

                const insertResult = await this.insertRole(role.id);

                if(insertResult === null){

                    const text = `:white_small_square: Users with the role **${roleName}** now have admin permission for this bot.`;
                    const pMessage = new Message("pass", this.message.channel, "Admin permissions successfully given", text);
                    await pMessage.send();
                    return;

                }else{

                    let text = "";

                    if(insertResult === 0){
                        text = `:white_small_square: The role **${roleName}** already has admin permissions.`;
                    }else{
                        text = `:white_small_square: Nothing was inserted into the table **roles**.`;
                    }

                    const eMessage = new Message("error", this.message.channel, errorTitle, text);
                    await eMessage.send();
                    return;
                }
            }
        }
    }

    bRoleAlreadyAdded(id){

        return new Promise((resolve, reject) =>{

            const query = "SELECT COUNT(*) as total_roles FROM roles WHERE id=?";

            db.get(query, [id], (err, result) =>{

                if(err){
                    console.trace(err);
                    reject(err);
                    return;
                }

                if(result.total_roles > 0){
                    resolve(true);
                    return;
                }

                resolve(false);
            });
        });
    }

    insertRoleQuery(id){

        return new Promise((resolve, reject) =>{

            const query = "INSERT INTO roles VALUES(?,?)";

            const now = Math.floor(Date.now() * 0.001);

            db.run(query, [id, now], async function(err){

                if(err){
                    console.trace(err);
                    reject(err);
                    return;
                }

                if(this.changes > 0){

                    resolve(true);
                    return;
                }

                resolve(false);
            });
        });
    }

    async insertRole(id){

        if(!await this.bRoleAlreadyAdded(id)){

            if(await this.insertRoleQuery(id)){
                return null;
            }
                
            return 1;
            
        }else{
            return 0;
        }
    }


    removeRoleQuery(id){

        return new Promise((resolve, reject) =>{

            const query = "DELETE FROM roles WHERE id=?";

            db.run(query, [id], function(err){

                if(err){
                    reject(err);
                    return;
                }

                if(this.changes > 0){
                    resolve(true);
                }

                resolve(false);
            });
        });
    }


    async removeRole(message){

        const result = this.splitDefaultCommand(message);

        if(result !== null){

            const roleName = result[1];

            const role = this.getDiscordRole(roleName);

            if(role === undefined){

                const text = `:white_small_square: There is no role in this server called **${roleName}**.`;

                const message = new Message("error", this.message.channel, "Failed to remove admin permissions", text);
                await message.send();
                return;

            }else{

                if(!await this.bRoleAlreadyAdded(role.id)){

                    const text = `:white_small_square: The role **${roleName}** doesn't have admin permissions.`;
                    const message = new Message("error", this.message.channel, "Failed to remove admin permissions", text);
                    await message.send();
                    return;
                }

                if(await this.removeRoleQuery(role.id)){

                    const text = `:white_small_square: The role **${roleName}** no longer has admin permissions.`;
                    const message = new Message("pass", this.message.channel, "Admin roles successfully removed", text);
                    await message.send();
                    return;

                }

                const text = `:white_small_square: No rows were updated in the table roles.`;
                const message = new Message("error", this.message.channel, "Failed to remove admin permissions", text);
                await message.send();
                return;


            }

        }else{

            const text = `:white_small_square: Incorrect syntax for the command ${queryPrefix}removeadmin.`;
            const message = new Message("error", this.message.channel, "Failed to remove admin permissions", text);
            await message.send();
            return;

        }
    }


    getAdminRoleIds(){

        return new Promise((resolve, reject) =>{

            const query = "SELECT id FROM roles";

            db.all(query, (err, rows) =>{

                if(err){
                    reject(err);
                    return;
                }

                const ids = [];

                for(let i = 0; i < rows.length; i++){
                    ids.push(rows[i].id);
                }

                resolve(ids);
            });
        });
    }

    async bUserHaveAdmin(){
    
        //console.log(this.message.member.roles.cache);

        const userRoles = this.message.member.roles.cache;

        const adminRoles = await this.getAdminRoleIds();

        //if no roles have admin allow anyone to use it for easier installation.
        if(adminRoles.length === 0) return true;

        for(let i = 0; i < adminRoles.length; i++){

            const a = adminRoles[i];

            if(userRoles.has(a)){
                return true;
            }
        }

        return false;
    }
}

module.exports = Permissions;