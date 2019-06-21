const kafka = require('kafka-node');
const Producer = kafka.Producer;
const HighLevelProducer = kafka.HighLevelProducer;
const client = new kafka.KafkaClient({ kafkaHost: '127.0.0.1:9092' });
const producer = new Producer(client);

function testProducerSend() {
    const payloads = [
        // { topic: 'kafkaResourceTopic', messages: 'hi', partition: 0 },
        // { topic: 'kafkaResourceTopic', messages: ['hello', 'world', ] },
        { topic: 'Topic1', key: 'test', messages: 'hi', partition: 0 },
        { topic: 'Topic2', key: 'test', messages: ['hello', 'world', ] },
        // { topic: 't', key: 'test', messages: 'hi' },
        // { topic: 't', key: 'test', messages: ['hello', 'world', ] },
    ];
    producer.on('ready', function() {
        producer.send(payloads, function(err, data) {
            console.log(err);
            console.log(data);
        });
    });
    producer.on('error', function(err) {
        console.log(err);
    });
}
testProducerSend();

function testClientCreateTopics() {
    const topicsToCreate = [{
            topic: 'Topic1',
            partitions: 1,
            replicationFactor: 1
        },
        {
            topic: 'Topic2',
            partitions: 1,
            replicationFactor: 1,
            // Optional set of config entries
            configEntries: [{
                    name: 'compression.type',
                    value: 'gzip'
                },
                {
                    name: 'min.compaction.lag.ms',
                    value: '50'
                }
            ],
            // Optional explicit partition / replica assignment
            // When this property exists, partitions and replicationFactor properties are ignored
            // replicaAssignment: [{
            //         partition: 0,
            //         replicas: [3, 4]
            //     },
            //     {
            //         partition: 1,
            //         replicas: [2, 1]
            //     }
            // ]
        }
    ];

    client.createTopics(topicsToCreate, (error, result) => {
        // result is an array of any errors if a given topic could not be created
        console.log(error);
        console.log(result);
    });
}
// testClientCreateTopics();

function testHighLevelProducerCreateTopics() {
    const p = new HighLevelProducer(client);
    // p.createTopics(['t', 't1'], false, function(err, data) {
    //     console.log(data);
    // });
    // Create topics async
    const topics = ['t'];
    // const topics = [{
    //         topic: 'Topic1',
    //         partitions: 1,
    //         replicationFactor: 2
    //     },
    //     {
    //         topic: 'Topic2',
    //         partitions: 5,
    //         replicationFactor: 3,
    //         // Optional set of config entries
    //         configEntries: [{
    //                 name: 'compression.type',
    //                 value: 'gzip'
    //             },
    //             {
    //                 name: 'min.compaction.lag.ms',
    //                 value: '50'
    //             }
    //         ],
    //         // Optional explicit partition / replica assignment
    //         // When this property exists, partitions and replicationFactor properties are ignored
    //         // replicaAssignment: [{
    //         //         partition: 0,
    //         //         replicas: [3, 4]
    //         //     },
    //         //     {
    //         //         partition: 1,
    //         //         replicas: [2, 1]
    //         //     }
    //         // ]
    //     }
    // ];
    p.on('ready', function() {
        p.createTopics(topics, true, function(err, data) {
            console.log(err);
            console.log(data);
        });
    });
    // p.createTopics(['t'], function(err, data) {
    //     console.log(err);
    //     console.log(data);
    // }); // Simply omit 2nd arg
}
// testHighLevelProducerCreateTopics();