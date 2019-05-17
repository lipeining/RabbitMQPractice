const amqp = require('amqp');
const config = require('./config');
const connection = amqp.createConnection(config);

// add this for better debuging
connection.on('error', function(e) {
    console.log("Error from amqp: ", e);
});
let exchange;


// Wait for connection to become established.
connection.on('ready', function() {
    exchange = connection.exchange('dead-order', {type: 'fanout'});
    connection.queue('dlx', function(queue) {
        queue.bind(exchange, '');
        // // Subscribe to the queue
        queue
            .subscribe(function(message, headers, deliveryInfo, messageObj) {
                let buffer = message.data;
                let result = JSON.parse(buffer.toString());
                console.log('in the dlx queue:');
                console.log(result);
                console.log("it's headers:");
                console.log(JSON.stringify(headers, null, 2));
            });
    });
});