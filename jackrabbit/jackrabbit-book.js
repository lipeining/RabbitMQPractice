// 1.工作原理
// 本质上是对amqp-lib包的包装，主要使用的events的事件类。
// 保证正确的ready,close,drain事件。
// 通过闭包的方式，将connection,exchange,queue保存在对象里面。
// 包含关系为：
// jackrabbit(exchange(queue))
// jackrabbit负责连接rabbitmq,同时提供connected,colse,等事件。
// 在初始化default或者对应类型的exchange时，开始创建exchange，
// 将connection注入到exchange,创建channel,绑定事件和replyQueue。
// 只有调用exchange.queue时，才会真正的创建一个queue。
// 所有的connect事件都需要考虑ready情况。同时，绑定close,emit connected事件

// 本质上，得到的对象都是对应的amqp,exchange,queue对象，
// 不过exchange使用了包装，只提供如下接口：
// queue: createQueue,
// connect: connect,
// publish: publish
// 底层自己使用闭包中的channel去绑定队列和发送消息，可以将数据格式定义为json,代码进行JSON.stringify()
// 内部会使用publishing,pendingReplies记录已经发送的消息和待处理的消息。
// 因为使用了自定义的数据格式，只需要发送时指定
// opts.replyTo = replyQueue.name;
// opts.correlationId = uuid.v4();
// pendingReplies[opts.correlationId] = opts.reply;
// 其中opts.reply需要使用者传入（回调函数） 如下：
// exchange.publish(
//     { n: 40 },
//     {
//       key: "rpc_queue",
//       reply: onReply // auto sends necessary info so the reply can come to the exclusive reply-to queue for this rabbit instance
//     }
//   );

// queue的方法只有下面几个
//     connect: connect,
//     consume: consume,
//     cancel: cancel,
//     purge: purge
// queue会使用闭包保存channel,consumerTag，用于处理
// 消息consume和purge,cancel等

// 2.注入方式
// 通过各自的connect函数
// 3.注意事项

// 需要注意的是，exchange,queue可以使用的接口已经写死。amqp-lib中有的方法，在这里不一定有，
// 但是一些事件的处理回调是存在的，比如on('drain')
// 同时：并没有处理error事件，也没有安全退出的方法。
// 对于打开的连接和channel没有退出操作。
// 不支持多连接。


