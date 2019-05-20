const amqp = require('amqp');
const config = require('./config');
const connection = amqp.createConnection(config);

// add this for better debuging
connection.on('error', function(e) {
    console.log("Error from amqp: ", e);
});
let exchange;
let exchangeOrder;

// 可以使用死信队列再次produce对应的消息。直到一定次数之后，彻底放弃该消息。
// 对于超时类型的消息，才使用重发规则，可以重新设置定时器 或者 超时时间，避免过长的超时发现
// 这种类型称其为超时重发模式， 
// 如果细化了里面的规则，可以建立一个降低峰值请求的模式。
// Wait for connection to become established.
connection.on('ready', function() {
    exchange = connection.exchange('dead-order', {type: 'fanout'});
    exchangeOrder = connection.exchange('delay-order');
    connection.queue('dlx', function(queue) {
        queue.bind(exchange, '');
        // // Subscribe to the queue
        queue
            .subscribe(function(message, headers, deliveryInfo, messageObj) {
                let buffer = message.data;
                let result = JSON.parse(buffer.toString());
                console.log('republish in the dlx queue:');
                console.log(result);
                console.log("republish it's headers:");
                console.log(JSON.stringify(headers, null, 2));
                if(result.counter >=3) {
                    console.log(`max counter : ${result.msg}`);
                } else {
                    result.counter = result.counter + 1;
                    exchangeOrder.publish('order', JSON.stringify(result), {expiration: "3000"});
                }
            });
    });
});