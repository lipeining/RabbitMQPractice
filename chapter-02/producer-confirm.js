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
    exchange = connection.exchange('hello-world', { confirm: true });
});

const message = 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w'.split(',');
let confirm = [];

function sendMessage() {
    for (let i = 0; i < message.length; i++) {
        setTimeout(function() {
            exchange.publish('hello', JSON.stringify(message[i]), {}, publishCallback);
            confirm.push({ id: message[i], confirm: false });
        }, i * 500);
        // exchange.publish('hello', JSON.stringify(message[i]));
    }
    setTimeout(() => {
        console.log(confirm);
    }, message.length * 500);
}
let index = 0;

function publishCallback(value) {
    // false 表示没事发生，true表示出现错误了.
    // console.log(value);
    if (!value) {
        confirm[index].confirm = true;
        index++;
    }
}

setTimeout(sendMessage, 2000);