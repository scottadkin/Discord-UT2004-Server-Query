import config from "./config.json" with {"type": "json"};
import { EmbedBuilder } from "discord.js";
import {simpleQuery} from "./database.js";


export default class Channels{

    constructor(servers){

        this.servers = servers;

    }

    getAllChannels(bOnlyIds){

        if(bOnlyIds === undefined) bOnlyIds = false;

        const query = "SELECT * FROM channels";
        const result = simpleQuery(query);

        if(!bOnlyIds) return result;

        return result.map((r) =>{
            return r.id;
        });
    }

    bAlreadyAdded(id){

        try{

            const channels = this.getAllChannels(id);

            if(channels.indexOf(id) !== -1){
                return true;
            }

            return false;

        }catch(err){
            console.trace(err);
        }
    }



    insertChannel(id){

        return new Promise((resolve, reject) =>{

            const query = "INSERT INTO channels VALUES(?,?,0)";

            const now = Math.floor(Date.now() * 0.001);

            this.db.run(query, [id, now], (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    deleteChannel(id){

        return new Promise((resolve, reject) =>{

            const query = "DELETE FROM channels WHERE id=?";

            this.db.run(query, [id], (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }



    async addChannel(channel){

        try{

            if(this.bAlreadyAdded(channel.id)){

                channel.send(`${config.failIcon} The channel **${channel.name}** is already enabled for bot usage.`);
                return;
            }

            await this.insertChannel(channel.id);

            channel.send(`${config.passIcon} The bot is now enabled in this channel.`);

        }catch(err){
            console.trace(err);
        }
    }


    async removeChannel(channel){

        try{

            if(this.bAlreadyAdded(channel.id)){

                await this.deleteChannel(channel.id);
                channel.send(`${config.passIcon} The bot is now disabled in this channel.`);
                return;
            }

            channel.send(`${config.failIcon} The bot was already not enabled in this channel.`);

        }catch(err){
            console.trace(err);
        }   
    }

    getChannelName(channels, id){

        for(let i = 0; i < channels.length; i++){

            if(channels[i].id === id) return channels[i].name;
        }

        return 'Not Found!';
    }

    async fetchChannels(guild, channelIds){

        const promises = [];

        for(let i = 0; i < channelIds.length; i++){
            promises.push(guild.channels.fetch(channelIds[i]).catch(() => null));
        }
    
        //text channels are type 0, dm 1, voice 2
        const responses = await Promise.all(promises);

        //channels are null if not found

        const missing = [...channelIds];

        const channels = [];

        for(let i = 0; i < responses.length; i++){

            const r = responses[i];
            if(r === null) continue;
            
            const index = missing.indexOf(r.id);
            if(index !== -1) missing.splice(index, 1);
            channels.push(r);

        }

        return {channels, missing};
    }

    async displayAllChannels(client, messageChannel, guild){

        try{

            const activeChannels = this.getAllChannels();

            let string = `**:floppy_disk: Channels enabled for bot use.**\n`;

            let channelsString = '';

            const aCIds = activeChannels.map((c) => c.id);

            const {channels, missing} = await this.fetchChannels(guild, aCIds);

            for(let i = 0; i < activeChannels.length; i++){

                channelsString += `**${this.getChannelName(channels, activeChannels[i].id)}** enabled ${new Date(activeChannels[i].added * 1000).toString()}\n`;
            }

            for(let i = 0; i < missing.length; i++){

                channelsString += `**Error:** Unable to find text channel with the ID of ${missing[i]}`;
            }

            if(channelsString == ''){
                channelsString = `There are currently no channels enabled for bot use.`;
            }

            messageChannel.send(string + channelsString);

        }catch(err){
            console.trace(err);
        }   
    }

    disableAutoChannel(){

        return new Promise((resolve, reject) =>{

            const query = "UPDATE channels SET auto_channel=0";

            this.db.run(query, (err) =>{

                if(err) reject(err);

                resolve();
            });
        });
    }

    enableAutoChannel(channelId){

        return new Promise((resolve, reject) =>{

            const query = "UPDATE channels SET auto_channel=1 WHERE id=?"
            
            this.db.run(query, [channelId], (err) =>{

                if(err) reject(err);

                resolve();
            });

        });
    }

    async deleteNonBotMessages(channel){

        try{
            const messages = await channel.messages.fetch();

           // console.log(`Delete non bot messages`);
            //console.log(`Found ${messages.array().length} messages to delete!`);

            await channel.bulkDelete(messages);
            
        }catch(err){
            console.trace(err);
        }
    }

    async setAutoChannel(channel){

        try{

            if(this.bAlreadyAdded(channel.id)){

                await this.disableAutoChannel();

                await this.servers.resetAllAutoMessageIds();

                let string = `**Welcome to the auto server query channel, the posts here will be updated with the latest UT2004 server information for each server added to the database.**`;

                await channel.send(`${string}`);

                const addedServers = await this.servers.getAllServers();
              //  console.log(await this.servers.getAllServers());

                //console.log(addedServers);

                let currentEmbed = 0;

                for(let i = 0; i < addedServers.length; i++){

                    currentEmbed = new EmbedBuilder().setDescription(`Waiting for data for **${addedServers[i].name}** id ${i + 1}`);

                    await channel.send(currentEmbed).then(async (message) =>{
                        
                       // console.log(`${message.id} server id =${i + 1}`);
                        await this.servers.setAutoMessageId(addedServers[i].ip, addedServers[i].port, message.id)
                    });
                    
                    
                }

                await this.enableAutoChannel(channel.id);

                await channel.setTopic(`**Welcome to the auto server query channel, the posts here will be updated with the latest UT2004 server information for each server added to the database.**`);

               // await this.deleteNonBotMessages(channel);

            }else{

                channel.send(`${config.failIcon} You must enable this channel first with the **${config.commandPrefix}allowchannel**, before being able to enable auto query.`);

            }

        }catch(err){
            channel.send(`${config.failIcon} There was an error setting up the auto query channel, please make sure the bot has the right permissions to manage a text channel.`);
            console.trace(err);
        }
    }


    getAutoQueryChannel(){

        const query = "SELECT id FROM channels WHERE auto_channel=1";

        const result = simpleQuery(query);

        if(result.length === 0) return null;

        return result[0].id;
     
    }

}
