const { queryPrefix } = require("../config.json");
const Servers = require("./servers");
const Permissions = require("./permissions");
const Message = require("./message");

class Command{

    constructor(message, ut2k4Query){

        this.message = message;
        this.channel = message.channel;
        this.command = this.removePrefix();
        this.ut2k4Query = ut2k4Query;
        this.serverManager = new Servers();
        //console.log(this);

        this.permissionManager = new Permissions(message);

        this.ipReg = /^q (.+)$/i;
        
    }

    static commandReg(){
        
        const escapeChars = "[\\^$.|?*+()";

        let prefix = queryPrefix;

        if(escapeChars.indexOf(prefix[0]) !== -1){
            prefix = `\\${queryPrefix}`;
        }

        return new RegExp(`^${prefix}(.+)$`,"i");
    }

    static bIsCommand(message){

        return Command.commandReg().test(message);
    }

    removePrefix(){

        const result = Command.commandReg().exec(this.message.content);

        if(result === null) return null;
        return result[1];
    }


    async processCommand(){

        try{

            const command = this.command;
            const lCommand = this.command.toLowerCase();

            const bHasAdmin = await this.permissionManager.bUserHaveAdmin();


            if(bHasAdmin){

                console.log(`User has admin permission`);

                if(lCommand.startsWith("giveadmin")){

                    await this.permissionManager.addRole(command);
                }
    
                if(lCommand.startsWith("removeadmin")){
    
                    await this.permissionManager.removeRole(command);
                }

                if(lCommand.startsWith("addserver")){

                    this.serverManager.addServer(command, this.channel, this.ut2k4Query);
                    //console.log(command);
                }
    
                if(lCommand.startsWith("deleteserver")){
    
                    this.serverManager.deleteServer(command, this.channel);
                }

            }else{

                const notAllowed = ["giveadmin","removeadmin","addserver","deleteserver"];

                for(let i = 0; i < notAllowed.length; i++){

                    if(lCommand.startsWith(notAllowed[i])){

                        const text = `You do not have permission to use the command **${queryPrefix}${notAllowed[i]}**`;
                        const eMessage = new Message("error", this.channel, `Access Denied`, text);
                        await eMessage.send();
                        return;

                    }
                }
                

            }

           /* if(this.ipReg.test(command)){

                await this.queryServer();
                return;
            }*/

            if(/^list$/i.test(command)){

                await this.ut2k4Query.createNewListResponse(this.channel);
                return;
            }

            if(lCommand.startsWith("debuglist")){
                this.serverManager.debugDisplayDatabase();
            }
            
            if(lCommand.startsWith("q")){
                this.serverManager.queryServer(command, this.channel, this.ut2k4Query);
            }

            

        }catch(err){
            console.trace(err);

        }
    }    
}

module.exports = Command;