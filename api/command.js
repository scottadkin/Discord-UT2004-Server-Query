const { queryPrefix, defaultServerPort } = require("../config.json");
const Functions = require("./functions");
const db = require("./database");

class Command{

    constructor(message, ut2k4Query, serverManager){

        this.message = message;
        this.channel = message.channel;
        this.command = this.removePrefix();
        this.ut2k4Query = ut2k4Query;
        this.serverManager = serverManager;
        //console.log(this);

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

            if(this.ipReg.test(command)){

                await this.queryServer();
                return;
            }

            if(/^list$/i.test(command)){

                await this.ut2k4Query.createNewListResponse(this.channel);
                return;
            }

            if(command.startsWith("addserver")){

                this.serverManager.addServer(command, this.channel, this.ut2k4Query);
                //console.log(command);
            }

            if(command.startsWith("debuglist")){
                this.serverManager.debugDisplayDatabase();
            }

        }catch(err){
            console.trace(err);

        }
    }

    async queryServer(){
  
        const ipResult = this.ipReg.exec(this.command);

        const parts = ipResult[1].split(":");

        if(Functions.bValidIp(ipResult[1])){

            const port = (parts.length > 1) ? parseInt(parts[1]) : defaultServerPort;
            this.ut2k4Query.fetchFullResponse(parts[0], port + 1, this.channel);

        }else{
            await message.reply("Not a valid ip:port combination");
        }
    }
    
}

module.exports = Command;