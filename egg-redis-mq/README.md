# redis-mq



## QuickStart

<!-- add docs here for user -->

### redis锁的方式
使用乐观锁，悲观锁。都是可能出现并发情况，所以需要判断redis.decr的返回结果来决定是否成功，
将消息分发到rabbitmq中的持久队列中。
在npm run test 使用了一个等待时间，使得consumer可以进行消费。设置了topology的subscribe为true。会产生消费者
fakeOrder指，虚拟的写入数据库的操作。使用数组保存数据
fakeToken指，一个返回成功的用户的token凭证，在另外的http请求中，需要有该token才认证成功，可以写入数据库中，
无论是否pay，都需要删除掉对应的token,或者超时之后，会在死信队列的处理中进行删除。

上面的论述，都是指定一条请求消费一个物品，如果需要可以指定数量的话，
那么需要使用悲观锁，先获取锁，再获取物品数量，此时可以保证，只有一个客户端可以获取锁，读取到的数字的完全正确的。

### rabbitmq的队列方式
1.使用三个队列：抢夺排队队列mqResourceQueue，成功的分发队列mqOrderQueue，死信队列mqDeadQueue。
2.使用一个redis键resource:avalible表示资源是否可用，因为该资源的读取会存在延时，导致过多的流量涌入mqResourceQueue,
但是，在mqResourceQueue端会进行单消费消费模式，保证是顺序读取数据，顺序计算数量，保证不超过resource的数量，
（这里的计数应该使用redis吗，只要保证prefetch=1,并且使用confirm模式的话，那么可以保证顺序操作redis数据库）
在这个消费者里面设置resource:avalible,达到一定时间延时锁定入口的作用。
在这个消费者里面，会不断将成功的人员再次投递到mqOrderQueue中，在此同时，设置fakeToken，如果超时未支付，就会进入mqDeadQueue.
基本同上。不过只是使用resource:avalible来限制数据流入。

如何动态确定消费者和mqResourceQueue的问题。通过topic吗？但是，谁保证队列和交换器的存在。
谁保证只有一个消费者。
  { name: 'mqResourceEx', type: 'topic', autoDelete: false, durable: true },
  { name: 'mqOrderEx', type: 'topic', autoDelete: false, durable: true },
  { name: 'mqDeadOrderEx', type: 'fanout', autoDelete: false, durable: true },
configure创建一个exchange，
init方法中，初始化对应的mqResourceQueue,mqOrderQueue,mqDeadQueue.  
mqResourceQueue: 
{ name: 'mqResourceQueue', autoDelete: false, subscribe: true },
{ name: 'mqOrderQueue', autoDelete: false, deadLetter: 'mqDeadOrderEx',  subscribe: true },
{ name: 'mqDeadQueue', autoDelete: false,  subscribe: true },
rabbot.bindQueue( mqResourceEx, mqResourceQueue, [resourceName], [connectionName] )
rabbot.bindQueue( mqOrderEx, mqOrderQueue, [resourceName], [connectionName] )
rabbot.bindQueue( mqDeadOrderEx, mqDeadQueue, [], [connectionName] )
并且设置对应的handle方法。

see [egg docs][egg] for more detail.

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

### Deploy

```bash
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.


[egg]: https://eggjs.org