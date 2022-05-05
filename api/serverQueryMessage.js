const { MessageEmbed } = require("discord.js"); 

class serverQueryMessage{

    constructor(serverResponse){

        this.serverResponse = serverResponse;
        this.channel = serverResponse.messageChannel;
        this.ip = serverResponse.ip;
        this.port = serverResponse.port - 1;

    }


    getPlayerIcon(index){

        if(index === 1) return ":first_place:";
        if(index === 2) return ":second_place:";
        if(index === 3) return ":third_place:";
        return ":joystick:";
    }

    createPlayerFields(){

        if(this.serverResponse.players.length === 0 && this.serverResponse.gameInfo.teamsInfo.length === 0){

            return [
                { "name": 'Players', "value": ':zzz: There are no players currently on the server.', "inline": false }
            ];

        }else{

            let totalRedPlayers = 0;
            let totalBluePlayers = 0;

            let redPlayers = "";
            let bluePlayers = "";
            let spectators = "";

            //32 is red team
            //64 is blue team
            //0 is spectator

            for(let i = 0; i < this.serverResponse.players.length; i++){

                const p = this.serverResponse.players[i];

                let currentString = "";

                if(this.serverResponse.gameInfo.totalTeams > 1){
                    //team names
                    if(p.id === 0) continue;

                    if(p.team === 0){
                    
                        currentString = `${p.name}`;

                    }else{

                        if(p.team === 32){

                            totalRedPlayers++;

                        }else if(p.team === 64){
                            totalBluePlayers++;
                        }

                        const icon = this.getPlayerIcon((p.team === 32) ? totalRedPlayers : totalBluePlayers);

                        currentString = `${icon} ${p.name} **${p.score}**\n`;
                    }

                    if(p.team === 32){

                        redPlayers += currentString;

                    }else if(p.team === 64){

                        bluePlayers += currentString;

                    }else{

                        if(spectators.length > 0) spectators += `, `;
                        spectators += currentString;
                    }
                }

                if(this.serverResponse.gameInfo.totalTeams <= 1){

                    const icon = this.getPlayerIcon(i + 1);

                    currentString = `${icon} ${p.name} **${p.score}**\n`;

                    redPlayers += currentString;
                }

            }

            if(this.serverResponse.gameInfo.totalTeams > 1 || this.serverResponse.gameInfo.teamsInfo.length > 1){

                if(redPlayers === "") redPlayers = "No Players.";
                if(bluePlayers === "") bluePlayers = "No Players.";

                const team1Info = this.serverResponse.gameInfo.teamsInfo[0] ?? null;
                const team2Info = this.serverResponse.gameInfo.teamsInfo[1] ?? null;

                let team1Title = "Red Team";
                let team2Title = "Blue Team";

                if(team1Info !== null){
                    team1Title = `${team1Info.name} ${team1Info.score}`;
                }

                if(team1Info !== null){
                    team2Title = `${team2Info.name} ${team2Info.score}`;
                }

                const fields = [
                    { "name": `:red_square: ${team1Title}`, "value": redPlayers, "inline": true },
                    { "name": `:blue_square: ${team2Title}`, "value": bluePlayers, "inline": true }
                ];



                if(spectators.length !== 0){
                    fields.push({ name: ':eyes: Spectators', "value": spectators, "inline": false });
                }

                return fields;
                    
                
            }else{

                let text = redPlayers /*+ bluePlayers + spectators*/;

                if(text.length === 0) text = "No players online.";
    
                return [
                    {"name": "Users Online", "value": text, "inline": false}
                ];
            }
        }   
    }


    getTotalPlayers(){

        let found = 0;

        for(let i = 0; i < this.serverResponse.players.length; i++){

            const p = this.serverResponse.players[i];

            //not a team name, and not a spectator
            if(p.id !== 0 && p.team !== 0 || this.serverResponse.gameInfo.totalTeams === 1){
                found++;
            }
        }

        return found;
    }


    async send(){

        const {name, map, gametype, players} = this.serverResponse.serverInfo;

        const exampleEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(name)
       // .setURL('https://discord.js.org/')
        .setAuthor({ "name": `${this.ip}:${this.port}`, iconURL: 'https://i.imgur.com/ihsPMOD.png', url: 'https://github.com/scottadkin/Discord-UT2004-Server-Query' })
        .setDescription(`:video_game: Gametype **${gametype}**\n:map: Map **${map}**\n:technologist: Players **${this.getTotalPlayers()}/${players.maxPlayers}**`)
        //.setThumbnail('https://i.imgur.com/ihsPMOD.png')
        .addFields(this.createPlayerFields())
        .addField(`Join Server`,`**<ut2004://${this.ip}:${this.port}>**`, false)
        .addField(`Join Server as Spectator`,`**<ut2004://${this.ip}:${this.port}?spectatorOnly=1>**`, false)
        .setTimestamp();

        await this.channel.send({"embeds": [exampleEmbed]});
    }

    async sendTimedOut(){

        const failedEmbed = new MessageEmbed().setColor('#0099ff')
        .setTitle(`${this.ip}:${this.port}`)
       // .setURL('https://discord.js.org/')
        .setAuthor({ "name": `${this.ip}:${this.port}`, iconURL: 'https://i.imgur.com/ihsPMOD.png', url: 'https://github.com/scottadkin/Discord-UT2004-Server-Query' })
        .setDescription(`:warning: Server timed out.`)
        .setTimestamp();

        await this.channel.send({"embeds": [failedEmbed]});
    }
}

module.exports = serverQueryMessage;