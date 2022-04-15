class Functions{

    constructor(){};

    static bInRange(value, start, end){

        if(value < start) return false;
        if(value > end) return false;

        return true;
    }

    static bValidIp(ipString){

        const reg = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3}):(\d+)$/i;

        const result = reg.exec(ipString);

        if(result !== null){

            const part1 = parseInt(result[1]);
            const part2 = parseInt(result[2]);
            const part3 = parseInt(result[3]);
            const part4 = parseInt(result[3]);
            const port = parseInt(result[5]);

            if(!Functions.bInRange(part1, 0,255) || !Functions.bInRange(part2, 0,255) || !Functions.bInRange(part3, 0,255) || !Functions.bInRange(part4, 0,255)){
                return false;
            }

            if(!Functions.bInRange(port, 1, 65535)) return false;

            return true;

        }else{

            return false;
        }
    }
}


module.exports = Functions;