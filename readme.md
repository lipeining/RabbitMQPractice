# learn RabbitMQ and Kafka 




kafka 
一个主题一般包含几个分区, 无法在整个主题范围内保证消息的顺序,但可以保证消息在单个分区内的顺序。
通过分区来实现数据冗余和伸缩性，分区可以分布在不同的服务器上。
一个主题可以横跨多个服务器,以此来提供比单个服务器更强大的性能。


群组保证每个分区只能被 一个消费者使用，消费者与分区之间的映射通常被称为悄费者对分区的所有权关系
单个 broker 可以轻松处理数千个分区以及每秒百万级的消息量。

集群的考虑原因：
- 数据类型分离
- 安全需求隔离
- 多数据中心(灾难恢复)
Kafka 的消息复制机制只能在单个集群里进行,不能在多个集群之间进行。
支持多个生产者.
多个消费者可以组成一 个群组,它们共享一个消息流,并保证整个群组对每个给定的消息只处理一次。

如果每秒钟要从主题上写入和读取 lGB 的数据,并且每个消费者每秒钟可以处理 50MB
的数据,那么至少需要 20 个分区。这样就可以让 20 个消费者同时读取这些分区,从而达
到每秒钟 lGB 的吞吐量。

单个消费者无法跟上数据生成的速度,所以可以增加更多的消费者,让它们分担负
载,每个消费者只处理部分分区的消息,这就是横向伸缩的主要手段。
简而言之,为每一个需要获取 一个或多个主题全部消息的应用程序创建一个消费者群组,
然后往群组里添加消费者来伸缩读取能力和处理能力,群组里的每个消费者只处理一部分
消息。

一个 消费者可以订阅主题(井加入消费者群组),或者为自己分配分区 , 但不能 同 时做这两件事情。

Kafka 使用 主题来组织数据,每个主题被分为若干个分区,每个分区有多个副本。那些副
本被保存在 broker 上,每个 broker 可以保存成百上千个属 于不同主题和分区的副本。
每个分区都有一个首领 副本 。 为了保证一 致性,所有生产者请求和消费者请求都会经过
这个副本。
首领以外的副本都是跟随者副本。跟随者副本不处理来自客户端的请求,它们唯 一的任
务就是从首领那里复制消息,保持与首领一致的状态。如果首领发生崩渍,其中的一个
跟随者会被提升为新首领。

持续请求得到 的最新悄息副本被称为 同步的副本 。在首领发生失效时,只有同步副
本才有可能被选为新首领。

Kafka 可以保证分区消息的顺序。如果使用同 一个生产者往同 一个分区写入消息,而且
消息 B 在悄息 A 之后 写入,那么 Kafka 可以保证消息 B 的偏移量比消息 A 的偏移量大,
而且消费者会先读取消息 A 再读取消息 B 。
•
只有当消息被写入分区的所有同步副本时(但不一定要写 入磁盘),它才被认为是“ 已
提交”的。生产者可以选择接收不同类型的确认,比如在消息被 完全提交时的确认,或
者在消息被写入首领副本时的确认,或者在消息被发送到网络时的确认。
•
只要还有一个副本是活跃的,那么已经提交的消息就不会丢失 。
消费者只能读取已经提交的悄息。

