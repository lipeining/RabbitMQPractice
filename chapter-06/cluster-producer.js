const amqp = require('amqp');
const config = require('./config');
const connection = amqp.createConnection(config);

// add this for better debuging
connection.on('error', function(e) {
    console.log("Error from amqp: ", e);
});


let exchange;
const message = 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w'.split(',');

// try {
    // queue subscribe It will automatically acknowledge receipt of each message.
    // Wait for connection to become established.
    connection.on('ready', function() {
        exchange = connection.exchange('cluster_test', { type: 'direct', autoDelete: false });
    });
// } catch (err) {
//     console.log(err);
// }

function sendMessage() {
    // 5秒钟，保证可以关闭一个node，测试集群的恢复
    // for (let i = 0; i < message.length; i++) {
    //     setTimeout(function() {
    //         exchange.publish('cluster_test', JSON.stringify(message[i]));
    //     }, i * 5000);
    // }
    exchange.publish('cluster_test', JSON.stringify(Date.now()));
    setTimeout(sendMessage, 500);
}

setTimeout(sendMessage, 2000);
