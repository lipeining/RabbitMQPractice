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
    exchange = connection.exchange('bind-exchange', {autoDelete: false});
    connection.queue('bind-queue', function(queue) {
        queue.bind(exchange, '5');
        // Subscribe to the queue
        queue
            .subscribe(function(message) {
                // console.log(message);
                // let buffer = Buffer.from(message.data);
                let buffer = message.data;
                let result = JSON.parse(buffer.toString());
                console.log(result);
                // Handle message here
                if(result === 'w') {
                    console.log('unbind after 5 seconds');
                    setTimeout(()=>{
                        queue.unbind(exchange, '5');
                    }, 5000);
                }
            })
            .addCallback(function(ok) { ctag = ok.consumerTag; });
    });
});