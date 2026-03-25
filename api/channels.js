import { failIcon, passIcon, commandPrefix } from "../config.js";
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

        const query = "INSERT INTO channels VALUES(?,?,0)";

        const now = Math.floor(Date.now() * 0.001);

        return simpleQuery(query, [id, now]);
    }

    deleteChannel(id){
        
        const query = "DELETE FROM channels WHERE id=?";

        return simpleQuery(query, [id]);
    }



    addChannel(channel){

        try{

            if(this.bAlreadyAdded(channel.id)){

                channel.send(`${failIcon} The channel **${channel.name}** is already enabled for bot usage.`);
                return;
            }

            this.insertChannel(channel.id);

            channel.send(`${passIcon} The bot is now enabled in this channel.`);

        }catch(err){
            console.trace(err);
        }
    }


    async removeChannel(channel){

        try{

            if(this.bAlreadyAdded(channel.id)){

                this.deleteChannel(channel.id);
                channel.send(`${passIcon} The bot is now disabled in this channel.`);
                return;
            }

            channel.send(`${failIcon} The bot was already not enabled in this channel.`);

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

        return simpleQuery("UPDATE channels SET auto_channel=0");
    }

    enableAutoChannel(channelId){

        return simpleQuery("UPDATE channels SET auto_channel=1 WHERE id=?", [channelId]);
    }

    async setTopicTitle(channel){

        try{
            await channel.setTopic(`**Welcome to the auto server query channel, the posts here will be updated with the latest UT2004 server information for each server added to the database.**`);

        }catch(err){

            if(err.rawError.code === 50013){
                await channel.send(`${failIcon} The bot does not have the needed permissions to set the topic title.`);
            }
        }
    }

    async setAutoChannel(channel){

        try{

            if(this.bAlreadyAdded(channel.id)){

                this.disableAutoChannel();

                this.servers.resetAllAutoMessageIds();

                let string = `**Welcome to the auto server query channel, the posts here will be updated with the latest UT2004 server information for each server added to the database.**`;

                await channel.send(`${string}`);

                await this.setTopicTitle(channel);

                const addedServers = this.servers.getAllServers();

                let currentEmbed = 0;

                for(let i = 0; i < addedServers.length; i++){

                    currentEmbed = new EmbedBuilder();
                    
                    currentEmbed.setDescription(`Waiting for data for **${addedServers[i].name}** id ${i + 1}`);

                    const message = await channel.send({"embeds": [currentEmbed]});
                    this.servers.setAutoMessageId(addedServers[i].ip, addedServers[i].port, message.id);
                }

                this.enableAutoChannel(channel.id);

                

            }else{

                await channel.send(`${failIcon} You must enable this channel first with the **${commandPrefix}allowchannel**, before being able to enable auto query.`);

            }

        }catch(err){
            await channel.send(`${failIcon} There was an error setting up the auto query channel, please make sure the bot has the right permissions to manage a text channel.`);

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
