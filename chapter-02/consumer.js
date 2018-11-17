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
    exchange = connection.exchange('hello-world');
    connection.queue('hello-queue', function(queue) {
        queue.bind(exchange, 'hello');
        // Subscribe to the queue
        queue
            .subscribe(function(message) {
                // console.log(message);
                // let buffer = Buffer.from(message.data);
                let buffer = message.data;
                let result = JSON.parse(buffer.toString());
                console.log(result);
                // Handle message here
                if (result === 'q') {
                    // console.log('unbind now');
                    queue.unbind(exchange, 'hello');
                    // console.log(queue);
                    // console.log('unsubscribe now');
                    // console.log(ctag);
                    // queue.unsubscribe(ctag);
                }
                else if(result === 'server-restart'){
                    // restart the queue
                    queue.bind(exchange, 'hello');
                }
            })
            .addCallback(function(ok) { ctag = ok.consumerTag; });
    });
});