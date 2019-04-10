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
    exchange = connection.exchange('bind-exchange', {autoDelete: false});
});

const message = 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w'.split(',');

function sendMessage() {
    let i = Math.floor(message.length * Math.random());
    exchange.publish('5', JSON.stringify(message[i]));
    setTimeout(sendMessage, i * 30);
}

setTimeout(sendMessage, 2000);