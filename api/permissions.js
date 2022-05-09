const db = require("./database");
const ErrorMessage = require("./errorMessage");
const PassMessage = require("./passMessage");

class Permissions{

    constructor(discordMessage){

        this.message = discordMessage;

    }

    async addRole(message){
  
        const reg = /^giveadmin (.+)$/i;
        const result = reg.exec(message);

        if(result !== null){

            const roleName = result[1];

            const role = this.message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());

            const errorTitle = "Failed to give role admin permissions";

            if(role === undefined){

                const text = `:white_small_square: There is no role called **${roleName}**.`;
                const eMessage = new ErrorMessage(this.message.channel, errorTitle, text);
                await eMessage.send();
                return;

            }else{

                const insertResult = await this.insertRole(role.id);

                if(insertResult === null){

                    const text = `:white_small_square: Users with the role **${roleName}** now have admin permission for this bot.`;
                    const pMessage = new PassMessage(this.message.channel, "Admin permissions successfully given", text);
                    await pMessage.send();
                    return;

                }else{

                    let text = "";

                    if(insertResult === 0){
                        text = `:white_small_square: The role **${roleName}** already has admin permissions.`;
                    }else{
                        text = `:white_small_square: Nothing was inserted into the table **roles**.`;
                    }

                    const eMessage = new ErrorMessage(this.message.channel, errorTitle, text);
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
}

module.exports = Permissions;