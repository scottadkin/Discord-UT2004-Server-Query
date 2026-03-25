import config from "./config.json" with {"type": "json"};
import {simpleQuery} from "./database.js";


export default class Roles{

    constructor(){

    }


    getAllAddedRoles(){

        return simpleQuery("SELECT * FROM roles");
    }


    deleteRole(id){
        return simpleQuery("DELETE FROM roles WHERE id=?", [id]);
    }

    bRoleAlreadyAdded(id){

        const query = "SELECT COUNT(*) as total_roles FROM roles WHERE id=?";
        const result = simpleQuery(query, [id]);

        return result[0].total_roles > 0;

    }

    insertRow(id){

        const now = Math.floor(Date.now() * 0.001);
        const query = "INSERT INTO roles  VALUES(?,?)";

        return simpleQuery(query, [id, now]);
    }

    addRole(id, name, channel){

        try{

            if(!this.bRoleAlreadyAdded(id)){

                this.insertRow(id);

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

    async getRoleId(name, guild){

        name = name.toLowerCase();

        const roles = await guild.roles.fetch();

        for(const [id, role] of roles){
            if(role.name.toLowerCase() === name) return id;
        }

        return null;

    }

    async getRoleName(id, guild){

        const roles = await guild.roles.fetch(id);

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

                currentRoleName = await this.getRoleName(roles[i].id, channel.guild);

                if(currentRoleName === null){
                    currentRoleName = `:warning: Deleted Role (${roles[i].id})`;
                }

                string += `**,** ${currentRoleName}`;
            }

            channel.send(`${string}.`);

        }catch(err){
            console.trace(err);
        }
    }
}
