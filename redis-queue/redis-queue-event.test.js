const RedisQueue = require('./redis-queue-event');
const redisQueue = new RedisQueue({ total: 100, name: 'ttt1' });
let readyList = ['rabbitmq-ready', 'exchange-ready', 'item-list-ready', 'item-counter-ready', 'item-consumers-ready'];
// for(let name of readyList) {
//     redisQueue.on(name, ()=>{

//     });
// } en-us/security/bulletin/ms12-020
redisQueue.on('rabbitmq-ready', (rabbitmq)=>{
    // console.log(rabbitmq);
    console.log('rabbitmq');
});
redisQueue.on('exchange-ready', (exchange)=>{
    // console.log(exchange);
    console.log('exchange');
});
redisQueue.on('item-list-ready', ()=>{
    console.log('item-list-ready');
});
redisQueue.on('item-counter-ready', ()=>{
    console.log('item-counter-ready');
});
redisQueue.on('item-consumers-ready', (consumers)=>{
    // console.log(consumers);
    console.log('consumers');
});
redisQueue.on('error', (err)=>{
    console.log(err);
});
redisQueue.on('done', ()=>{
    console.log(redisQueue.replySuccess.length);
});
let id = 1;
const BBPromise = require('bluebird');
const mapData = new Array(100);
for (let i = 0; i < mapData.length; i++) {
    mapData[i] = i + 1;
}
const concurrencyNow = 20;
async function test() {
    // console.log(redisQueue);
    console.log(redisQueue.itemRedisItemConsumersKey);
    let len = await redisQueue.getItemRedisConsumersLen();
    console.log(len);
    console.log('---done ---');
    // await redisQueue.setOptions({total: 45});
    // // redisQueue.total = 45;
    // console.log('set total 45');
    // const mapData = 'ABCDEFGHIJKLMN'.split('');
    setTimeout(mapReq, 3000);
    // setTimeout(consume, 3000);
    // setTimeout(consume, 3000);
}
async function mapReq(concurrency = concurrencyNow) {
    let l = await redisQueue.getItemRedisConsumersLen();
    // console.log(`id ${id}`);
    // console.log(l);
    setTimeout(mapReq, 10000 / concurrency);
    await BBPromise.map(mapData, async (item) => {
        try {
            await redisQueue.consumeOneItem({ userId: id, userName: item });
            id++;
        } catch (err) {
            console.log(err);
        }
    }, { concurrency });
}

async function consume() {
    try {
        await redisQueue.consumeOneItem({ userId: id, userName: 'wowo' });
        id++;
        setTimeout(consume, 100);
    } catch (err) {
        console.log(err);
        clearTimeout(consume);
    }
}
test();