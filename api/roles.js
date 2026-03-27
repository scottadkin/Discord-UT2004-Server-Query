import { passIcon, failIcon, defaultAdminRole } from "../config.js";
import {simpleQuery} from "./database.js";


export default class Roles{

    constructor(){}

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

    
        if(!this.bRoleAlreadyAdded(id)){

            this.insertRow(id);

            return channel.send(`${passIcon} Users with the role **${name}** can now use admin commands.`);

        }else{
            return channel.send(`${failIcon} That role already has admin privileges.`);
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

        const roles  = await guild.roles.fetch(id);

        for(let i = 0; i < roles.length; i++){

            if(roles[i].name.toLowerCase() === id){
                return roles[i].name;
            }
        }

        return null;

    }

    async getRoleNames(roleIds, guild){

        if(roleIds.length === 0){
            return null;
        }

        const roles = await guild.roles.fetch();

        const found = {};

        for(let i = 0; i < roleIds.length; i++){

            const id = roleIds[i];
            const role = roles.get(id);

            if(role !== undefined){
                found[id] = role.name;
            }else{
                found[id] = `:warning: Deleted Role(${id})`;
            }
        }

        return found;
    }

    async displayAddedRoles(channel){

   
        const roles = this.getAllAddedRoles();

        let string = `**Roles that have admin privileges:**\n`;

        string += `${defaultAdminRole}(config.js)`;

        const names = await this.getRoleNames(roles.map((r) => r.id), channel.guild);

        if(names === null){
            return channel.send(`${failIcon} No roles found`);
        }

        for(const name of Object.values(names)){
            string += `, ${name}`;
        }

        return channel.send(string);
    
    }
}
