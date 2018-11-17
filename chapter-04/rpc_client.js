const amqp = require('amqp');
const config = require('./config');
const connection = amqp.createConnection(config.rpcUser);

// add this for better debuging
connection.on('error', function(e) {
    console.log("Error from amqp: ", e);
});


let exchange;
let _queue;
// queue subscribe It will automatically acknowledge receipt of each message.
// Wait for connection to become established.
connection.on('ready', function() {
    exchange = connection.exchange('rpc', { type: 'direct', passive: true, autoDelete: false });
    // 在这里定义一个pong的消息
    connection.queue('', { exclusive: true }, function(queue) {
        _queue = queue;
        queue.subscribe(function(message, headers, deliveryInfo, messageObject) {
            // console.log(headers);
            let buffer = message.data;
            let result = JSON.parse(buffer.toString());
            // Handle message here
            console.log(`receive rpc server reply :`);
            console.log(result);
        });
    });
});

/**
 * send ping rpc
 */
function sendPing() {
    console.log('sent ping to server, wait for reply: ');
    // console.log(_queue);
    let options = { replyTo: _queue.name, headers: {} };
    exchange.publish('ping',
        JSON.stringify({ name: 'ping_client', time: Date.now() }), options
    );
    setTimeout(sendPing, 5000);
    // 可以使用死循环
}

setTimeout(sendPing, 2000);

// rpc_server中的 deliveryInfo

// rpc_server中没有replyTo ,如果rpc_client中没有发送replyTo的话
// { contentType: 'application/octet-stream',
//   queue: 'ping',
//   deliveryTag: <Buffer 00 00 00 00 00 00 00 05>,
//   redelivered: false,
//   exchange: 'rpc',
//   routingKey: 'ping',
//   consumerTag: 'node-amqp-27949-0.45245193266934747' }


// rpc_server中有replyTo ,如果rpc_client中发送replyTo的话
// { contentType: 'application/octet-stream',
//   headers: {},
//   replyTo: 'amq.gen-XyFyt0k0OxGzPgKpIjtgaQ',
//   queue: 'ping',
//   deliveryTag: <Buffer 00 00 00 00 00 00 00 02>,
//   redelivered: false,
//   exchange: 'rpc',
//   routingKey: 'ping',
//   consumerTag: 'node-amqp-28082-0.7393630890303378' }
