const amqp = require('amqp');
const config = require('./config');
const connection = amqp.createConnection(config.rpcUser);

// add this for better debuging
connection.on('error', function(e) {
    console.log("Error from amqp: ", e);
});


let exchange;

// queue subscribe It will automatically acknowledge receipt of each message.
// Wait for connection to become established.
connection.on('ready', function() {
    exchange = connection.exchange('rpc', { type: 'direct', autoDelete: false });
    connection.queue('ping', { autoDelete: false }, function(queue) {
        queue.bind(exchange, 'ping');
        queue
            .subscribe(function(message, headers, deliveryInfo, messageObject) {
                // console.log(headers);
                // console.log(deliveryInfo);
                // console.log(messageObject);
                // deliveryInfo.reply_to?
                let buffer = message.data;
                let result = JSON.parse(buffer.toString());
                // Handle message here
                // { name: 'ping_client', time: 1542337252797 }
                console.log(`ping is coming:`);
                console.log(result);
                // reply to headers.reply_to use default exchange?
                // 使用reply_to无须指定交换器
                let now = Date.now();
                connection.publish(deliveryInfo.replyTo, JSON.stringify({ name: 'ping_server', time: now, timeDiff: now - result.time }));
            });
    })
});