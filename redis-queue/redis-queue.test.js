const RedisQueue = require('./redis-queue');
const redisQueue = new RedisQueue({ total: 30, name: 'ttt1' });
let id = 1;
const BBPromise = require('bluebird');
const mapData = new Array(100);
for (let i = 0; i < mapData.length; i++) {
    mapData[i] = i + 1;
}
const concurrencyNow = 15;
async function test() {
    // console.log(redisQueue);
    console.log(redisQueue.itemRedisItemConsumersKey);
    let len = await redisQueue.getItemRedisConsumersLen();
    console.log(len);
    console.log('---done ---');
    await redisQueue.setOptions({total: 45});
    // redisQueue.total = 45;
    console.log('set total 45');
    // const mapData = 'ABCDEFGHIJKLMN'.split('');
    setTimeout(mapReq, 3000);
    // setTimeout(consume, 3000);
    // setTimeout(consume, 3000);
}
async function mapReq(concurrency = concurrencyNow) {
    let l = await redisQueue.getItemRedisConsumersLen();
    console.log(`id ${id}`);
    console.log(l);
    setTimeout(mapReq, concurrency);
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