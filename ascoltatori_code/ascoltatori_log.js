

// 1.基本原理
/**
 * An `AbstractAscoltatore` is a class that inherits from `EventEmitter`.
 * It is also the base class of `ascoltatori`. It is not meant to be used alone,
 * but it defines the interface for every ascoltatore.
 *
 * Every ascoltatore emits the following events:
 *  - `ready`, when the ascolatore is ready for subscribing and/or
 *     publishing messages;
 *  - `closed`, when the ascoltatore has closed all the connections
 *     and therefore it cannot accept new messages;
 *  - `error`, if something goes wrong.
 *
 * @api public
 */

const absParent = {};
const settings = {};
const nativeSettings = {separator: ','};
absParent._separator = settings.separator || '/',
absParent._wildcardOne = settings.wildcardOne || '+',
absParent._wildcardSome = settings.wildcardSome || '*';
absParent._nativeSettings = nativeSettings;

// 这个分隔符，+,*是为了允许用户自定义，但是代码内部是依旧使用 / + *，只有在返回用户时，使用in,out进行转换
if (nativeSettings.separator && 
    (absParent._separator !== nativeSettings.separator)) {
  absParent._reInSeparator = new RegExp('\\' + absParent._separator, 'g');
  absParent._reOutSeparator = new RegExp('\\' + nativeSettings.separator, 'g');
}
if (nativeSettings.wildcardOne &&
    (absParent._wildcardOne !== nativeSettings.wildcardOne)) {
  absParent._reInWildcardOne = new RegExp('\\' + absParent._wildcardOne, 'g');
}
if (nativeSettings.wildcardSome &&
    (absParent._wildcardSome !== nativeSettings.wildcardSome)) {
  absParent._reInWildcardSome = new RegExp('\\' + absParent._wildcardSome, 'g');
}
console.log(absParent);
const topic = '/hello/a/world';
const inTopic = topic.replace(absParent._reInSeparator, nativeSettings.separator);
const outTopic = inTopic.replace(absParent._reOutSeparator, absParent._separator);
const myTopic = inTopic.replace(/,/g, absParent._separator);
console.log(inTopic);
console.log(outTopic);
console.log(myTopic)


// 举例：amqp的源代码：
// 根据传入的参数，使用trie进行继承，同时，初始化连接。
// 主要的使用的库是Qlobber
// 可以将回调函数注册到matcher对象中，方便地pub/sub
// 下面为，实际的子类如果真正地订阅消息，
// 只有发布的时候，使用trie的publish方法在筛选可以发布的消息.
// =====问题： 这样的话，这个发布者和消费者都必须是同时一个人，或者必须注册同样的routingKey。因为这个macther对象是私有的。

// 初始化函数
that._queue.subscribe({
    ack: true,
    prefetchCount: 42
  }, function(message, headers, deliveryInfo) {
    that._queue.shift();

    var topic = that._recvTopic(deliveryInfo.routingKey);
    
    debug("new message received from queue on topic " + topic);

    that._ascoltatore.publish(topic, message.data.toString());
  });
  that._queue.once("basicConsumeOk", function() {
    defer(callback);
  });

//   subscribe函数
  this._queue.once("queueBindOk", function() {
    // trick against node-amqp not working
    // as advertised
    setTimeout(function() {
      debug("queue bound to topic " + topic);
      defer(done);
    }, 5);
  });

  this._queue.bind(this._exchange, this._subTopic(topic));

// close 函数
// 如果关闭了，会destroy queue，虽然这是其本身创建的queue  
// 2.注入方式，使用方式
// 通过继承的方式，可以将基本的方法流传下来，比如，topic的转换，
// publish,subscribe的基本原型。
// 针对每一个子类，有自己的实际的publish,subscribe的方法，回调用this._publish,this._subscribe
// 设置正确的值。
// 每一个子类的实现，都需要emit,ready,closed,error三类事件，使得父类可以处理出错等，
// 或者通知使用者关于组件的工作情况。
// 每一个子类都需要实现自己的 连接，队列绑定，发送消息，关闭连接，清理资源等操作。
// 在trie类中，使用Qlobber，实现回调的绑定，订阅消息的确定等操作。
// 不过只在该实例中存在。
// 3.注意事项























