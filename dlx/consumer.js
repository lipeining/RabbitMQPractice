const amqp = require('amqp');
const config = require('./config');
const connection = amqp.createConnection(config);

// add this for better debuging
connection.on('error', function(e) {
    console.log("Error from amqp: ", e);
});
let exchange;
let ctag;

// Wait for connection to become established.
connection.on('ready', function() {
    exchange = connection.exchange('delay-order');
    connection.queue('order', {arguments: {'x-dead-letter-exchange': 'dead-order'}}, function(queue) {
        queue.bind(exchange, 'order');
        // 1.不消费队列信息，可以等待时间超时，进入dead-order这个exchange
        // 2.消费队列信息，不过reject=true,requeue=false
        // // Subscribe to the queue
        queue
            .subscribe({ack: true}, function(message) {
                // console.log(message);
                // let buffer = Buffer.from(message.data);
                let buffer = message.data;
                let result = JSON.parse(buffer.toString());
                console.log(result);
                queue.shift(true,false);
            })
            .addCallback(function(ok) { ctag = ok.consumerTag; });
    });
});