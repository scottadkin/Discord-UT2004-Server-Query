const Bot = require('./api/bot');


new Bot();


/*setInterval(() =>{


    const toMb = (input) =>{

        return (input / 1024 / 1024).toFixed(2);
    }

    const m = process.memoryUsage();

    console.log(`RSS ${toMb(m.rss)}MB heapTotal ${toMb(m.heapTotal)}MB heapUsed ${toMb(m.heapUsed)}MB external ${toMb(m.external)}MB `);

},1000);*/