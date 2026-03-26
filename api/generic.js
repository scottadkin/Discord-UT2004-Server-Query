import {lookup} from "node:dns/promises";


export async function bValidAddress(address){

    try{

        await lookup(address, {"family": 4});
    
        return true;

    }catch(err){

        return false;
    }
}

/**
 * 
 * @param {string} target if target is already an ipv4 address return the ip
 * @returns {Promise<string|null>} if failed to get ip return null
 */
export async function getIpFromAddress(target){

    try{

        if(bValidIPV4Address(target)) return target;

        const result = await lookup(target, {"family": 4});
        return result.address ?? null;

    }catch(err){
        return null;
    }
}


export function bValidIPV4Address(input){

    const reg = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/i;

    return reg.test(input);
}


export function bValidPort(input){

    input = parseInt(input);

    if(input !== input) return false;

    if(input > 0 && input <= 65535) return true;
        
    return false;
}

export function getFlagString(input){
    return (input.length === 2 && input !== "xx") ? `:flag_${input}: ` : "";
}