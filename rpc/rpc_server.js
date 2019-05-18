
const amqp = require('amqp');
const config = require('./config');
const connection = amqp.createConnection(config);

// add this for better debuging
connection.on('error', function(e) {
    console.log("Error from amqp: ", e);
});



let exchange;

// queue subscribe It will automatically acknowledge receipt of each message.
// Wait for connection to become established.
connection.on('ready', function() {
    exchange = connection.exchange('rpc', { type: 'direct', autoDelete: true });
    connection.queue('rpc_queue', { autoDelete: true }, function(queue) {
        queue.bind(exchange, 'fib');
        queue
            .subscribe(function(message, headers, deliveryInfo, messageObject) {
                // console.log(headers);
                console.log(deliveryInfo);
                // console.log(messageObject);
                // deliveryInfo.reply_to?
                let buffer = message.data;
                let result = JSON.parse(buffer.toString());
                // Handle message here
                console.log(result);
                const ans = fibonacci(result.n);
                // reply to headers.reply_to use default exchange?
                // 使用reply_to无须指定交换器
                let now = Date.now();
                connection.publish(deliveryInfo.replyTo, 
                    JSON.stringify({ name: 'rpc_server', time: now, timeDiff: now - result.time, ans, n: result.n }),
                    {correlationId: deliveryInfo.correlationId}
                    );
            });
    })
});


// amqp.connect('amqp://localhost', function(error0, connection) {
//   if (error0) {
//     throw error0;
//   }
//   connection.createChannel(function(error1, channel) {
//     if (error1) {
//       throw error1;
//     }
//     var queue = 'rpc_queue';

//     channel.assertQueue(queue, {
//       durable: false
//     });
//     channel.prefetch(1);
//     console.log(' [x] Awaiting RPC requests');
//     channel.consume(queue, function reply(msg) {
//       var n = parseInt(msg.content.toString());

//       console.log(" [.] fib(%d)", n);

//       var r = fibonacci(n);

//       channel.sendToQueue(msg.properties.replyTo,
//         Buffer.from(r.toString()), {
//           correlationId: msg.properties.correlationId
//         });

//       channel.ack(msg);
//     });
//   });
// });

function fibonacci(n) {
  if (n == 0 || n == 1)
    return n;
  else
    return fibonacci(n - 1) + fibonacci(n - 2);
}