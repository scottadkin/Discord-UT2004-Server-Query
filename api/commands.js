const { queryPrefix, defaultServerPort } = require("../config.json");
const Functions = require("./functions");

class Commands{

    constructor(){

        this.commandReg = new RegExp(`^${queryPrefix}(.+)$`,"i");

    }

    bIsCommand(message){

        return this.commandReg.test(message);
    }

    removePrefix(message){

        const result = this.commandReg.exec(message);

        if(result === null) return null;

        return result[1];

    }


    async queryServer(messageChannel, command, ut2k4Query){

        const ipReg = /^q (.+)$/i;

        const ipResult = ipReg.exec(command);

        if(ipResult !== null){

            const parts = ipResult[1].split(":");

            if(Functions.bValidIp(ipResult[1])){

                const port = (parts.length > 1) ? parseInt(parts[1]) : defaultServerPort;

                ut2k4Query.fetchFullResponse(parts[0], port + 1, messageChannel);

            }else{

                await message.reply("Not a valid ip:port combination");
            }

        }
    }


}

module.exports = Commands;