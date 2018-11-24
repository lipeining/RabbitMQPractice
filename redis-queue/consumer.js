const amqp = require('amqp');
const config = require('./config');
const connection = amqp.createConnection(config.rabbitmq);

// add this for better debuging
connection.on('error', function(e) {
    console.log("Error from amqp: ", e);
});
// console.log(process);
console.log(process.argv);
let exchange;
let queue;
let name = process.argv[2];
let number = Number(process.argv[3]);
// let qname = `queue-${number}`;
let qname = `queue-q`;
console.log(`name: ${name}`);
console.log(`qname: ${qname}`);
// queue subscribe It will automatically acknowledge receipt of each message.
// Wait for connection to become established.
connection.on('ready', function() {
    exchange = connection.exchange(name, { autoDelete: false });
    queue = connection.queue(qname, { autoDelete: false });
    // if(number === 1) {
    //     queue.bind(exchange, `${name}.*`);
    // } else if(number === 2) {
    //     queue.bind(exchange, `${name}.*`);
    // } else if(number === 3) {
    //     queue.bind(exchange, `${name}.*`);
    // }
    queue.bind(exchange, `${name}.*`);
    queue
        .subscribe(function(message, headers, deliveryInfo, messageObject) {
            let buffer = message.data;
            let result = JSON.parse(buffer.toString());
            // { nowLen: 11 , input: {} }
            console.log(`${number} consumer: order is coming:`);
            console.log(result);
            // todo 这里应该有和数据库和日志的交互代码
            connection.publish(deliveryInfo.replyTo, JSON.stringify({result, number}));
        });
    process.send(`${number} : ready`);
});
process.on('exit', (code) => {
    console.log(`${number}  consumer 退出码: ${code}`);
});