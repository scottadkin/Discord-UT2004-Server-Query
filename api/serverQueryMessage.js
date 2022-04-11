const { MessageEmbed } = require("discord.js"); 

class serverQueryMessage{

    constructor(channel){


        this.channel = channel;
    }

    async send(){

        const exampleEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Server Response from: ')
       // .setURL('https://discord.js.org/')
        .setAuthor({ name: 'UT2004 Server Query', iconURL: 'https://i.imgur.com/ihsPMOD.png', url: 'https://github.com/scottadkin/Discord-UT2004-Server-Query' })
        .setDescription('Some description here')
        .setThumbnail('https://i.imgur.com/ihsPMOD.png')
        /*.addFields(
            { name: 'Regular field title', value: 'Some value here' },
            { name: '\u200B', value: '\u200B' },
            { name: 'Inline field title', value: 'Some value here', inline: true },
            { name: '**Join as Player:** <ut2004://www.google.com>', value: '\u200B', inline: false },
            { name: '**Join as Spectator:** <ut2004://www.google.com>', value: '\u200B', inline: false },
        )*/
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