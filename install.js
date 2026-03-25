import { simpleQuery } from "./api/database.js";

const queries = [
    `CREATE TABLE IF NOT EXISTS servers(
        name TEXT NOT NULL,
        alias TEXT NOT NULL,
        ip TEXT NOT NULL,
        port INTEGER NOT NULL,
        players INTEGER NOT NULL,
        max_players INTEGER NOT NULL,
        map TEXT NOT NULL,
        gametype TEXT NOT NULL,
        country TEXT NOT NULL,
        added INTEGER NOT NULL,
        modified INTEGER NOT NULL,
        last_message TEXT NOT NULL
        )
    `,

    `CREATE TABLE IF NOT EXISTS roles(
        id TEXT NOT NULL,
        added INTEGER NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS channels(
        id TEXT NOT NULL,
        added INTEGER NOT NULL,
        auto_channel INTEGER NOT NULL
    )`
];

for(let i = 0; i < queries.length; i++){

    try{
        simpleQuery(queries[i]);
    }catch(err){
        console.trace(err);
    }
}

console.log("Database Install completed.");