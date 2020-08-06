

const sqlite3 = require('sqlite3').verbose();
const config = require('./config.json');

class Database{

    constructor(){
		
		this.sqlite = new sqlite3.Database('./db/'+config.databaseFile, (err) => {
			if (err) {
			  console.log(err.message);
			}
			console.log('Connected to the database.');
		});
	}
}

module.exports = Database;