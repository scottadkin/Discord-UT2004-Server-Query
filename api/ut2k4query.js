
const dgram =  require("dgram");


class UT2K4Query{

    constructor(){

        this.server = dgram.createSocket("udp4");

        this.createServerEvents();

        this.pendingData = [];
    }

    createServerEvents(){

        this.server.on("error", (err) =>{

            console.trace(err);
        
        });
        
        this.server.on("message", (msg, rinfo) =>{
        
            //console.log(msg[0]);
           // console.log(JSON.stringify(msg));
            //console.log("message");
           ///console.log(`${msg}`);
           // console.log(rinfo);

            msg = this.removeServerResponse(msg);
            const responseId = msg[0];
            msg = this.removeResponseId(msg);

            if(responseId === 0){
                this.parseBasicInfo(rinfo.address, rinfo.port, msg);
            }else{
                console.log(`Unknown response id`);
            }
        });
        
        this.server.on("listening", () =>{
        
            console.log("Listening");
        });
        
        this.server.bind(13438);
        
        //this.server.send(`\x80\x00\x00\x01`, testPort + 1, testIp);
    }

    fetchBasicInfo(ip, port){

        this.server.send(`\x80\x00\x00\x00`, port, ip);
        //this.server.send(`\x80\x00\x00\x01`, port, ip);
        //this.server.send(`\x80\x00\x00\x02`, port, ip);
    }

    fetchServerInfo(ip, port){
        this.server.send(`\x80\x00\x00\x01`, port, ip);
    }

    fetchPlayerInfo(ip, port){
        this.server.send(`\x80\x00\x00\x02`, port, ip);
    }

    fetchServerInfoAndPlayerInfo(ip, port){
        this.server.send(`\x80\x00\x00\x03`, port, ip);
    }

    removeServerResponse(data){

        return data.slice(4, data.length - 1);
    }

    removeResponseId(data){

        return data.slice(1, data.length - 1);
    }

    removeColorData(){

    }

    parseBasicInfo(ip, port, content){

        const test = content.slice(4, content.length -1);

        let byteOffset = 4;

        console.log(content[byteOffset]);
        console.log(test[0]);

        console.log(`parsing basic info. For: ${ip}:${port - 1}`);

        console.log(`${content}`);
    }

}

module.exports = UT2K4Query;