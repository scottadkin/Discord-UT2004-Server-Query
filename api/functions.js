const { defaultServerPort } = require("../config.json");

class Functions{

    constructor(){};

    static bInRange(value, start, end){

        if(value < start) return false;
        if(value > end) return false;

        return true;
    }

    static bValidIp(ipString){

        const reg = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(|:(\d+))$/i;

        const result = reg.exec(ipString);

        if(result !== null){

            const part1 = parseInt(result[1]);
            const part2 = parseInt(result[2]);
            const part3 = parseInt(result[3]);
            const part4 = parseInt(result[3]);
            const port = (result[6] === "") ? defaultServerPort : parseInt(result[6]);

            if(!Functions.bInRange(part1, 0,255) || !Functions.bInRange(part2, 0,255) || !Functions.bInRange(part3, 0,255) || !Functions.bInRange(part4, 0,255)){
                return false;
            }

            if(!Functions.bInRange(port, 1, 65535)) return false;

            return true;

        }else{

            return false;
        }
    }

    static splitDomainPort(domain, defaultPort){

        const reg = /^(.+?):(.+)$/i;
        
        const result = reg.exec(domain);

        if(result === null){
            return {"domain": domain, "port": defaultPort};
        }

        let port = parseInt(result[2]);

        if(port !== port) port = defaultPort;

        return {"domain": result[1], "port": port};
    }
}


module.exports = Functions;