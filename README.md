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

# Running the bot
- Open command prompt in the directory you installed the files.
- Run the command **node app**

# First time use
When the bot has joined the server only people with the role "adminRole" can use the bot, to change this:
- `.allowchannel` This will enable any user to use non admin commands in the current channel.
- `.allowrole <role name>` This will enable users with the specified role to use admin commands.
- `.setauto` Sets the current channel to be the auto query channel, it is recommended to lock this text channel from people writing in there, to stop the auto update posts from being out of view, if they do become to far out of sight you can just use the same command to make the bot post new responses.

# Bot commands

**User Commands**
- `.servers` Displays basic server information for all the servers added to the database.
- `.active` Displays basic server information for all servers added that have players on it.
- `.q<serverId>` Displays the server's name, current gametype, map, and players.
- `.q <server ip>:<port>` Displays a server's name, current gametype, map, and players.
- `.ip<serverid>` Displays clickable link to the server.

**Admin Commands**
- `.allowchannel` Enables the bot to be used in the current channel.
- `.deletechannel` Disables the bot from being used in the current channel.
- `.allowrole <role name>` Enables users with the specified role to use admin commands.
- `.deleterole <role name>` Disables users with the specified role to use the admin commands.
- `.addserver <alias> <ip>:<port>` Adds the specified server to the database.
- `.deleteserver <serverid>` Deletes the server with the specified id.
- `.setauto` Sets the current channel as the auto query channel. This can also be used to reset the auto query making it post all new responses.
`

![alt text](https://i.imgur.com/cVtcp6H.png, "image")

# Known Problems
- On rare occasions .q commands are posted twice.
- If autoQueryInterval is set too low it can stop working after time, it's recommended to keep it above 60 seconds.