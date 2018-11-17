const amqp = require('amqp');
const config = require('./config');
const connection = amqp.createConnection(config.alertUser);

// add this for better debuging
connection.on('error', function(e) {
    console.log("Error from amqp: ", e);
});
let exchange;
let criticalCtag;
let rateLimitCtag;
let criticalQueue;
let rateLimitQueue;

// queue subscribe It will automatically acknowledge receipt of each message.
// Wait for connection to become established.
connection.on('ready', function() {
    exchange = connection.exchange('alerts', {autoDelete: false});
    connection.queue('critical-queue', function(queue) {
        queue.bind(exchange, 'critical.*');
        criticalQueue = queue;
        queue
        .subscribe(function(message) {
            let buffer = message.data;
            let result = JSON.parse(buffer.toString());
            // Handle message here
            console.log(`a critical alert: ${result}`);
        })
        .addCallback(function(ok) { criticalCtag = ok.consumerTag; });
    });
    connection.queue('rate-limit-queue', function(queue) {
        queue.bind(exchange, '*.rate_limit');
        rateLimitQueue = queue;
        queue
        .subscribe(function(message) {
            let buffer = message.data;
            let result = JSON.parse(buffer.toString());
            // Handle message here
            console.log(`a rate limit alert: ${result}`);
        })
        .addCallback(function(ok) { rateLimitCtag = ok.consumerTag; });        
    });
});

