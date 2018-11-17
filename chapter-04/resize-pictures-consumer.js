const amqp = require('amqp');
const config = require('./config');
const connection = amqp.createConnection(config.alertUser);

// add this for better debuging
connection.on('error', function(e) {
    console.log("Error from amqp: ", e);
});

let exchange;

// queue subscribe It will automatically acknowledge receipt of each message.
// Wait for connection to become established.
connection.on('ready', function() {
    exchange = connection.exchange('upload-pictures', {type: 'fanout', autoDelete: false});
    connection.queue('resize', function(queue) {
        queue.bind(exchange, '');
        queue
        .subscribe(function(message) {
            let buffer = message.data;
            let result = JSON.parse(buffer.toString());
            // Handle message here
            console.log(`resize : ${result.userId}-${result.imageId}-${result.pictures}`);
        })
    });
});