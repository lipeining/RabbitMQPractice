const amqp = require('amqp');
const config = require('./config');
const connection = amqp.createConnection(config);

// add this for better debuging
connection.on('error', function(e) {
    console.log("Error from amqp: ", e);
});


let exchange;
let queue;

// try {
//     // queue subscribe It will automatically acknowledge receipt of each message.
//     // Wait for connection to become established.
//     connection.on('ready', function() {
//         exchange = connection.exchange('cluster_test', { type: 'direct', autoDelete: false });
//         queue = connection.queue('cluster_test', { autoDelete: false });
//         queue.bind(exchange, 'cluster_test');
//         queue.subscribe(function(message, headers, deliveryInfo, messageObject) {
//             let buffer = message.data;
//             let result = JSON.parse(buffer.toString());
//             // Handle message here
//             console.log(`receive message:`);
//             console.log(result);
//         });
//     });
// } catch (err) {
//     console.log(err);
// }


function start() {
    // 不要加死循环，似乎集群会自动转移故障节点上的队列，直到只剩两个节点
    try {
        // queue subscribe It will automatically acknowledge receipt of each message.
        // Wait for connection to become established.
        connection.on('ready', function() {
            exchange = connection.exchange('cluster_test', { type: 'direct', autoDelete: false });
            queue = connection.queue('cluster_test', { autoDelete: false });
            queue.bind(exchange, 'cluster_test');
            queue.subscribe(function(message, headers, deliveryInfo, messageObject) {
                let buffer = message.data;
                let result = JSON.parse(buffer.toString());
                // Handle message here
                console.log(`receive message:`);
                console.log(result);
            });
        });
    } catch (err) {
        console.log(err);
    }
}

start();