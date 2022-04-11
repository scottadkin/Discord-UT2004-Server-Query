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

        if(this.serverResponse.players.length === 0){

            return [
                { "name": 'Players', "value": ':zzz: There are no players currently on the server.', "inline": false }
            ];

        }else{

            let totalRedPlayers = 0;
            let totalBluePlayers = 0;

            let redPlayers = "";
            let bluePlayers = "";
            let spectators = "";

            //0 is red team
            //64 is blue team
            //32 is spectator

            //:first_place: :second_place: :third_place: :medal: 

            for(let i = 0; i < this.serverResponse.players.length; i++){

                const p = this.serverResponse.players[i];

                console.log(`${p.team} ${p.score}`);

                let currentString = "";

                if(p.team === 32){
                
                    currentString = `${p.name}`;

                }else{

                    if(p.team === 0){

                        totalRedPlayers++;

                    }else if(p.team === 64){
                        totalBluePlayers++;
                    }

                    const icon = this.getPlayerIcon((p.team === 0) ? totalRedPlayers : totalBluePlayers);

                    currentString = `${icon} ${p.name} **${p.score}**\n`;
                }

                if(p.team === 0){

                    //if(redPlayers.length > 0) redPlayers += `, `;

                    redPlayers += currentString;

                }else if(p.team === 64){

                    //if(bluePlayers.length > 0) bluePlayers += `, `;

                    bluePlayers += currentString;

                }else{

                    if(spectators.length > 0) spectators += `, `;
                    spectators += currentString;
                }
            }

            if(this.serverResponse.gameInfo.totalTeams > 1){

                return [
                    { name: 'Red Team', "value": redPlayers, "inline": true },
                    { name: 'Blue Team', "value": bluePlayers, "inline": true },
                    { name: 'Spectators', "value": spectators, "inline": false },
                ];
            }else{
    
                return [
                    {"name": "Users Online", "value": redPlayers + bluePlayers + spectators, "inline": false}
                ];
            }
        }   
    }


    async send(){

        const {name, map, gametype, players} = this.serverResponse.serverInfo;

        const exampleEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(name)
       // .setURL('https://discord.js.org/')
        .setAuthor({ "name": `${this.ip}:${this.port}`, iconURL: 'https://i.imgur.com/ihsPMOD.png', url: 'https://github.com/scottadkin/Discord-UT2004-Server-Query' })
        .setDescription(`:video_game: Gametype **${gametype}**\n:map: Map **${map}**\n:technologist: Players **${players.players}/${players.maxPlayers}**`)
        .setThumbnail('https://i.imgur.com/ihsPMOD.png')
        .addFields(this.createPlayerFields()
            //{ name: 'Regular field title', value: 'Some value here' },
           //{ name: '\u200B', value: '\u200B' },
           // [{ name: 'Red Team', value: 'Some value here', inline: true },
            //{ name: 'Blue Team', value: 'Some value here', inline: true },]
            //{ name: '**Join as Player:** <ut2004://www.google.com>', value: '\u200B', inline: false },
           // { name: '**Join as Spectator:** <ut2004://www.google.com>', value: '\u200B', inline: false },
        )
        .addField(`Join Server`,`**<ut2004://www.google.com>**`, false)
        .addField(`Join Server as Spectator`,`**<ut2004://www.google.com?spectatorOnly=1>**`, false)
       // .addField('Inline field title', 'Some value here', true)
        //.setImage('https://i.imgur.com/ihsPMOD.png')
        .setTimestamp()
        .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/ihsPMOD.png' });

        await this.channel.send({"embeds": [exampleEmbed]});
    }
}

module.exports = serverQueryMessage;