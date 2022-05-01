const Database = require("./api/database");

const queries = [

    `CREATE TABLE IF NOT EXISTS servers(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ip TEXT NOT NULL,
        port INTEGER NOT NULL,
        added INTEGER NOT NULL,
        edited INTEGER NOT NULL,
        times_edited INTEGER NOT NULL
    )`

];


for(let i = 0; i < queries.length; i++){

    Database.run(queries[i], (err) =>{

        if(err){
            console.log(err);
            return;
        }

        console.log(`Query ${i+1} out of ${queries.length} completed.`);
    })
}