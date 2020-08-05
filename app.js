const Bot = require('./api/bot');

try{
    const test = new Bot();
}catch(err){
    console.trace(err);
}