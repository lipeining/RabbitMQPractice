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
    exchange = connection.exchange('hello-world');
});

const message = 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w'.split(',');

function sendMessage() {
    for (let i = 0; i < message.length; i++) {
        setTimeout(function() {
            exchange.publish('hello', JSON.stringify(message[i]));
        }, i * 500);
        // exchange.publish('hello', JSON.stringify(message[i]));
    }
}

setTimeout(sendMessage, 2000);