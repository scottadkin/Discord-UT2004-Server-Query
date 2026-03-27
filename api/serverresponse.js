import { getFlagString } from "./generic.js";

export default class ServerResponse{

    constructor(ip, port, type, channel, domain, bAuto, servers){

        this.ip = ip;
        this.port = port;
        this.type = type;

        this.domain = (domain !== ip) ? domain : null ;

        this.bAuto = bAuto;

        this.channel = channel;

        this.servers = servers;

        this.timeStamp = Math.floor(Date.now() * 0.001);

        this.data = {
            "players": [],
            "totalTeams": 0,
            "teamScores": [],
            "maxPlayers": 0
        };

        this.playerPacketsReceived = 0;
        this.bGotBasic = false;
        this.bGotAllData = false;
        this.bSentMessage = false;
    }

    setValue(key, value){

        if(key === 'players'){

            this.data.players = this.data.players.concat(value);
            return;
        }
        
        this.data[key] = value;
        
    }

    getTotalTeams(){

        let teams = [];

        for(let i = 0; i < this.data.players.length; i++){

            const p = this.data.players[i];

            if(teams.indexOf(p.team) === -1){

                teams.push(p.team);
            }
        }

        return teams.length;
    }

    addFlag(name){

        const reg = /^(.+?) \((\w{2})\)$/i;

        const result = reg.exec(name);

        if(result === null) return `:video_game: ${name}`;

        let newName = '';

        if(result[2] == "UK"){
            result[2] = "gb";
        }else if(result[2] == "EL"){
            result[2] = "gr";
        }

        newName = `:flag_${result[2].toLowerCase()}: ${result[1]}`

        return newName;
        
    }


    getPlayersString(team, bIgnoreScore){

        let string = ``;

        this.data.players.sort((a, b) =>{

            a = a.score;
            b = b.score;

            if(a > b){
                return -1;
            }else if(a < b){
                return 1;
            }

            return 0;

        });

        for(let i = 0; i < this.data.players.length; i++){

            const p = this.data.players[i];

            if(team !== null){

                if(p.team === team){

                    p.name = this.addFlag(p.name);

                    if(p.id !== 0){

                        if(bIgnoreScore === undefined){
                            string += `${p.name} **${p.score}**\n`;
                        }else{
                            string += `${p.name} `;
                        }
                    }
                }

            }else{

                p.name = this.addFlag(p.name);
                string += `${p.name} **${p.score}**\n`;
            }
        }

        if(string == ''){

            string = ':zzz: There are currently no players.';
        }

        return string;
    }

    getTeamScore(id){

        const teamScores = this.data.teamScores;

        const teamIcons = [
            ':red_square:',
            ':blue_square:'
        ];

        if(teamScores.length !== 0){

            if(id < teamScores.length){

                return `${teamIcons[id]} ${teamScores[id].name} ${teamScores[id].score}` 
            }
        }

        const backUpNames = [
            `${teamIcons[id]} Red Team`,
            `${teamIcons[id]} Blue Team`
        ];

        return backUpNames[id];
    }

    createTeamFields(totalTeams){

        if(this.data.players.length === 0){
            return [
                { name: 'Players', value: ':zzz: There are currently no players.' }
            ];
        }

        const fields = [];

        if(totalTeams < 2){

            fields.push({ name: "Connections", value: this.getPlayersString(null), inline: true})

        }else{

            fields.push({ name: this.getTeamScore(0), value: this.getPlayersString(0), inline: true});
            fields.push({ name: this.getTeamScore(1), value: this.getPlayersString(1), inline: true});
            fields.push({ name: 'Spectators', value: this.getPlayersString(-1, true) });
        }

        return fields;

    }


    getTotalPlayers(totalTeams){

        let total = 0;

        for(let i = 0; i < this.data.players.length; i++){

            const p = this.data.players[i];

            if(totalTeams > 1){

                if(p.team != -1){
                    total++;
                }

            }else{
                total++;
            }
        }

        return total;
    }

    setTeamScores(){

        for(let i = 0; i < this.data.players.length; i++){

            const p = this.data.players[i];

            if(p.id === 0){

                this.data.teamScores.push({"name": p.name, "score": p.score});
                continue;
            }
        }
    }

    async sendFullResponse(MessageEmbed, embedColor){

        const totalTeams = this.getTotalTeams();

        if(totalTeams > 1){
            this.setTeamScores();
        }


        const flag = this.servers.getServerFlag(this.ip, this.port);

        const flagString = getFlagString(flag);
        const teamFields = this.createTeamFields(totalTeams);

        let address = this.ip;

        if(this.domain !== null){
            address = this.domain;
        }

        let description = `:wrestling: Users Online: **${this.getTotalPlayers(totalTeams)}/${this.data.maxPlayers}**
        :pushpin: Gametype: **${this.data.gametype}**
        :map: Map: **${this.data.map}**\n`;

        const response = new MessageEmbed()
        .setColor(embedColor)
        .setTitle(`${flagString}${this.data.name}`)
        .setDescription(description)
        .addFields(teamFields)
        .setFooter({"text": `IP: ${address}:${this.port}\n`})
        .setTimestamp();

        const replyContent = {"embeds": [response]};
        this.address = address;

        if(!this.bAuto){

            // console.log(`Not auto message id`);
            await this.channel.send(replyContent);
            this.channel = null;

        }else{

            const editMessageId = this.servers.getServerAutoMessageId(address, this.port);
            
            if(editMessageId !== null){

                const message = await this.channel.messages.fetch(editMessageId);

                return message.edit(replyContent);
                
            }else{

                this.channel.send(replyContent).then((msg) =>{

                    this.servers.setAutoMessageId(address, this.port, msg.id);
                    this.servers = null;
                });
            }
        }

     
    }


    async finishedStep(MessageEmbed, embedColor){

        if(this.type == 'basic'){
            
            this.bGotAllData = true;
            this.bGotBasic = true;

            let ip = this.ip;

            if(this.domain !== null){

                ip = this.domain;
            }

            if(this.data.name !== undefined){
                this.servers.updateServerInfo(ip, this.port, this.data);
            }
            return;

        }else if(this.type == 'full'){

            if(!this.bGotBasic){

                this.bGotBasic = true;

                if(this.data.currentPlayers == 0){

                    this.bGotAllData = true;
                    this.sendFullResponse(MessageEmbed, embedColor);
                    
                }
                return;
            }

            this.playerPacketsReceived++;

            if(this.data.players.length >= this.data.currentPlayers - 1 || this.playerPacketsReceived >= 2){

                this.bGotAllData = true;
                this.sendFullResponse(MessageEmbed, embedColor);

            }        
        } 
    }
}