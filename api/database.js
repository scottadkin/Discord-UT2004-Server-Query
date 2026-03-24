import config from "./config.json" with {"type": "json"};
import {DatabaseSync} from 'node:sqlite';

const database = new DatabaseSync(`${config.dbFile}`);

export function simpleQuery(query, vars){

    const prepare = database.prepare(query);

    if(vars !== undefined){
        return prepare.all(...vars);
    }else{
        return prepare.all();
    }
}


