const db = require('./api/database');


const queries = [

    `CREATE TABLE IF NOT EXISTS servers (
        name TEXT NOT NULL,
        alias TEXT NOT NULL,
        ip TEXT NOT NULL,
        real_ip TEXT NOT NULL,
        port INTEGER NOT NULL,
        gametype TEXT NOT NULL,
        map TEXT NOT NULL,
        current_players INTEGER NOT NULL,
        max_players INTEGER NOT NULL,
        added INTEGER NOT NULL,
        modified INTEGER NOT NULL,
        message_id TEXT NOT NULL,
        channel_id TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS channels (
        channel_id TEXT NOT NULL,
        name TEXT NOT NULL, 
        auto_query INT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS roles (
        role_id TEXT NOT NULL,
        name TEXT NOT NULL,
        added INTEGER NOT NULL
    )`
];


db.serialize(() =>{

    for(let i = 0; i < queries.length; i++){

        console.log(`Attempting query ${i}`);

        db.run(queries[i] , (err) =>{

            if(err){
                console.trace(err);
            }
            
            if(err == null){
                console.log(`Query ${i} passed!`);
            }
        });
    } 
    //process.exit();
});