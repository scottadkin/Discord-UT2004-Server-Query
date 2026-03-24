import sqlite3 from "sqlite3";
const sVerbose = sqlite3.verbose();
import config from "./config.json" with {"type": "json"};


export default class Database{

    constructor(){

        this.sqlite = new sVerbose.Database(`${config.dbFile}`);
    }
}

