# Discord-UT2004-Server-Query
 A discord bot that communicates with Unreal Tournament 2004 servers and displays their responses.

# Requirements
- Node.js Version 12 or later.

# Installing
- Extract the contents of the archive into a directory.
- Open command prompt in the same directory.
- Run the command **npm install** to install the required dependencies.
- Now run the command **node install** to create the database tables.
- Now open the config file /api/config.js.
- Add your Discord bot token, if this is not done correctly the bot can't join your server. <https://discordpy.readthedocs.io/en/latest/discord.html>
- Make sure adminRole is a role in your discord server that you have access to, to be able to use admin commands.
- The config file is also where you can set the command prefix, by default it's dot(.)

# Running the bot
- Open command prompt in the directory you installed the files.
- Run the command **node app**

# First time use
When the bot has joined the server only people with the role "adminRole" can use the bot, to change this:
- `.allowchannel` This will enable any user to use non admin commands in the current channel.
- `.allowrole <role name>` This will enable users with the specified role to use admin commands.
- `.setauto` Sets the current channel to be the auto query channel, it is recommended the auto query channel is a new channel where users can't post as the bot will delete previous messages when this command is used in a text channel.

# Auto Query Information
- When an auto query channel is set the bot will delete previous messages posted in the channel(Up to the last 50 posts)
- Every time the command is used the bot will post fresh messages for each server added to the database, after each query interval the bot will edit the previous message with the latest response from the respected server.
- If a new server is added after this command is used it will post any new servers in the auto query channel.
- If a server is deleted from the database list the bot will remove it's respected message from the auto query channel.

# Bot commands

## adminCommands
**.addserver alias ip:port** Add a server to the database with the specified alias ip and port, if port is not specified 7777 is used.
**.deleteserver serverID** Deletes the specified server matching the IP:PORT of the ID.
**.editserver serverID type value** Edits the specified server's type with the new value, valid types are **IP, Port, Alias**.
**.roles** Displays all user roles that can use admin commands.
**.allowrole Name** Allows users with said role to use admin commands.
**.removerole Name** Disables users with said role from using admin commands.
**.allowchannel** Allows the bot to be used in the current channel.
**.removechannel** Disables the bot to be used in the current channel.
**.channels** Displays all channels that are enabled for bot usage.

## Normal Commands
**.help** Displays this command.
**.servers** Displays all the servers added to the database.
**.active** Displays all the servers added to the database that has at least 1 player in it.
**.qID** Queries the specified server ip:port matching that server ID in the database.
**.q ip:port** Queries a UT2004 server with the specified ip:port, if port is not provided 7777 is used.
**.ipID** Displays the name and ip:port of the server added to the database.
        
`
Updated .q and .ip commands with join as spectator added

![alt text](https://i.imgur.com/dmMjVwW.png, "image")

Old .q display with other commands

![alt text](https://i.imgur.com/txWh80F.png, "image")
