export const discordToken = "";
export const dbFile = "./db/data.db";
//what role can control the bot when first added to the server.
export const defaultAdminRole = "Toilet Brush";

export const commandPrefix = ".";
//port bot queries ut2k4 servers for user commands
export const udpPort = 1333;
//if server doesn't respond in x seconds display timedout
export const responseTimeout = 2;
export const bDisplayNotEnabled = true;
export const embedColor = "ffffff";
export const failIcon = ":no_entry:";
export const passIcon = ":white_check_mark:";

//how many seconds between bot pings to the ut2k4 servers in the list to update basic info such as servername, gametypename, mapname and total players
export const serverInfoInterval = 12;
//how many seconds the auto query will update auto update channel if enabled
export const autoQueryInterval = 30;
export const validServerEditTypes = [
    "ip",
    "port",
    "country",
    "alias"
];
//max amount of servers to display in one message
//used for .servers, splits messaged into multiple parts.
export const serversPerMessage = 10;
//label tam servers as tam instead of deathmatch
export const bLabelAsTAM = true;