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
    exchange = connection.exchange('upload-pictures', { type: 'fanout', autoDelete: false });
});

const message = [
    {userId: 1, pictures: 'path/to/1', imageId: '1'},
    {userId: 2, pictures: 'path/to/2', imageId: '2'},
    {userId: 3, pictures: 'path/to/3', imageId: '3'},
    {userId: 4, pictures: 'path/to/4', imageId: '4'},
    {userId: 5, pictures: 'path/to/5', imageId: '5'}
];

/**
 * 
 */
function sendMessage() {
    for (let i = 0; i < message.length; i++) {
        setTimeout(function() {
            exchange.publish('', JSON.stringify(message[i]));
            // exchange.publish(receiver[0], JSON.stringify(message[i]));
        }, i * 500);
    }
}

setTimeout(sendMessage, 2000);
