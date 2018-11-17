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
    exchange = connection.exchange('alerts', { autoDelete: false });

});

const message = 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w'.split(',');
const receiver = ['critical.', '.rate_limit', 'critical.rate_limit'];


/**
 * 任意概率地发送 给critical 和 rate_limit
 */
function sendMessage() {
    for (let i = 0; i < message.length; i++) {
        setTimeout(function() {
            exchange.publish(receiver[Math.floor(i % receiver.length)], JSON.stringify(message[i]));
            // exchange.publish(receiver[0], JSON.stringify(message[i]));
        }, i * 500);
    }
}

setTimeout(sendMessage, 2000);