import { dbFile } from "../config.js";
import {DatabaseSync} from 'node:sqlite';

const database = new DatabaseSync(`${dbFile}`);

export function simpleQuery(query, vars){

    const prepare = database.prepare(query);

    if(vars !== undefined){
        return prepare.all(...vars);
    }else{
        return prepare.all();
    }
}


