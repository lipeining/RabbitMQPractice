
const amqp = require('amqp');
const config = require('./config');
const connection = amqp.createConnection(config.rpcUser);

// add this for better debuging
connection.on('error', function(e) {
    console.log("Error from amqp: ", e);
});
// 定义一个回复的queue，必须是独一无二的exclusive=true

let exchange;
let _queue;
let correlationId;
const relationMap = {};
// queue subscribe It will automatically acknowledge receipt of each message.
// Wait for connection to become established.
connection.on('ready', function() {
    exchange = connection.exchange('rpc', { type: 'direct', autoDelete: true });
    // 在这里定义一个pong的消息
    connection.queue('', { exclusive: true }, function(queue) {
        _queue = queue;
        queue.subscribe(function(message, headers, deliveryInfo, messageObject) {
            // console.log(headers);
            let buffer = message.data;
            let result = JSON.parse(buffer.toString());
            // Handle message here
            // console.log(message);
            if (deliveryInfo.correlationId == correlationId) {
                console.log(`receive rpc server reply :`);
                console.log(result);
            }
            if (relationMap.hasOwnProperty(deliveryInfo.correlationId)) {
                console.log(`map get ${deliveryInfo.correlationId}`);
                relationMap[deliveryInfo.correlationId] = result;
            }
        });
    });
});

/**
 * send num rpc
 */
function sendNum() {
    console.log('sent num to server, wait for reply: ');
    // console.log(_queue);
    correlationId = generateUuid();
    let options = { replyTo: _queue.name, headers: {},correlationId };
    relationMap[correlationId] = null;
    exchange.publish('fib',
        JSON.stringify({ name: 'num_client', time: Date.now(), n: Math.floor(Math.random() * 10) }), options
    );
    setTimeout(sendNum, 5000);
    // 可以使用死循环
}

setTimeout(sendNum, 2000);




// amqp.connect('amqp://localhost', function(error0, connection) {
//   if (error0) {
//     throw error0;
//   }
//   connection.createChannel(function(error1, channel) {
//     if (error1) {
//       throw error1;
//     }
//     channel.assertQueue('', {
//       exclusive: true
//     }, function(error2, q) {
//       if (error2) {
//         throw error2;
//       }
//       var correlationId = generateUuid();
//       var num = parseInt(args[0]);

//       console.log(' [x] Requesting fib(%d)', num);

//       channel.consume(q.queue, function(msg) {
//         if (msg.properties.correlationId == correlationId) {
//           console.log(' [.] Got %s', msg.content.toString());
//           setTimeout(function() { 
//             connection.close(); 
//             process.exit(0) 
//           }, 500);
//         }
//       }, {
//         noAck: true
//       });

//       ch.sendToQueue('rpc_queue',
//         Buffer.from(num.toString()),{ 
//           correlationId: correrlationId, 
//           replyTo: q.queue });
//     });
//   });
// });

function generateUuid() {
  return Math.random().toString() +
         Math.random().toString() +
         Math.random().toString();
}
