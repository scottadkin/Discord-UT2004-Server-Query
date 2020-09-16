const sqlite3 = require('sqlite3').verbose();
const config = require('./config.json');


class Database{

    constructor(){

        this.sqlite = new sqlite3.Database(`${config.dbFile}`);
    }
}


module.exports = Database;