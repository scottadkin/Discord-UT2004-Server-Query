const sqlite3 = require('sqlite3').verbose();
const config = require('./api/config');

const db = new sqlite3.Database(config.dbFile, sqlite3.OPEN_READWRITE, (err) =>{

    if(err){
        console.trace(err);
        return;
    }

        console.log("Connected to database");
});


const queries = [
    `CREATE TABLE ut_servers (
        name TEXT NOT NULL,
        alias TEXT NOT NULL,
        ip TEXT NOT NULL,
        real_ip TEXT NOT NULL,
        port INTEGER NOT NULL,
        password TEXT NOT NULL,
        country TEXT NOT NULL,
        created INTEGER NOT NULL,
        modified INTEGER NOT NULL,
        current_players INTEGER NOT NULL,
        max_players INTEGER NOT NULL,
        map TEXT NOT NULL,
        gametype TEXT NOT NULL,
        gloalscore INTEGER NOT NULL,
        time_limit INTEGER NOT NULL
    )`,
    `CREATE TABLE discord_roles (
        name TEXT NOT NULL,
        role_id TEXT NOT NULL
    )`,
    `CREATE TABLE discord_channels (
        name TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        auto INTEGER NOT NULL
    )`
    ];

    

    //serialize makes the queries run in order not in parallel
db.serialize(() => {


    for(let i = 0; i < queries.length; i++){

        db.exec(queries[i], (err) =>{

            if(err){
                console.log(err);
            }else{
                console.log("Query "+i+" passed!");
            }
        });
    }

    /*for(let i = 0; i < 5; i++){

        db.run("INSERT INTO ut_servers VALUES(?,?,?,'-','password','xx',12345,12345,12,23,'CTF-Face','Capture the Flag',?,?)",
        ["test name "+i, "alias "+i, 2, Math.floor(Math.random() * 100), 4], (err) =>{

            if(err){
                console.log(err);
            }
        });
    }


    db.each("SELECT * FROM ut_servers", (err, row) =>{

        if(err){
            console.trace(err);
        }
        console.log(row);
    });

    db.run("DELETE FROM ut_servers", (err) =>{

        if(err){
            console.log(err);  
        }else{
            console.log("Deleted all content");
        }
    })*/



});