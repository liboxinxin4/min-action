"use strict";
exports.__esModule = true;
var kafka_streams_1 = require("kafka-streams");
var kafka_streams_2 = require("kafka-streams");
var avro = require("avsc");
/**
 * Action to get maximum value from a stream of records. The minField parameter denotes
 * the field that the naximum value will be selected from.
 */
var batchOptions = {
    batchSize: 5,
    commitEveryNBatch: 1,
    concurrency: 1,
    commitSync: false,
    noBatchCommits: false
};
var uuidv4 = require("uuid/v4");
var gid = uuidv4();
var nativeConfig = {
    noptions: {
        "metadata.broker.list": "localhost:9092",
        "group.id": gid,
        "client.id": "kafka-streams-test-name-native",
        "event_cb": true,
        "compression.codec": "snappy",
        "api.version.request": true,
        "socket.keepalive.enable": true,
        "socket.blocking.max.ms": 100,
        "enable.auto.commit": false,
        "auto.commit.interval.ms": 100,
        "heartbeat.interval.ms": 250,
        "retry.backoff.ms": 250,
        "fetch.min.bytes": 100,
        "fetch.message.max.bytes": 2 * 1024 * 1024,
        "queued.min.messages": 100,
        "fetch.error.backoff.ms": 100,
        "queued.max.messages.kbytes": 50,
        "fetch.wait.max.ms": 1000,
        "queue.buffering.max.ms": 1000,
        "batch.num.messages": 10000
    },
    tconf: {
        "auto.offset.reset": "earliest",
        "request.required.acks": 1
    }
};
var MinAction = /** @class */ (function () {
    function MinAction(inputTopic, outputTopic, errTopic, minField, schema) {
        this.inputTopic = inputTopic;
        this.outputTopic = outputTopic;
        this.errTopic = errTopic;
        this.minField = minField;
        this.kafkaStreams = new kafka_streams_1.KafkaStreams(nativeConfig);
        this.storage = new kafka_streams_2.KStorage();
        this.storage.set("min", 0);
        this.stream = this.kafkaStreams.getKStream(this.inputTopic, this.storage);
        this.parsedSchema = avro.Type.forSchema(JSON.parse(schema));
    }
    MinAction.prototype.execute = function (datFieldArray) {
        var _this = this;
        console.log('input-topic = ' + this.inputTopic);
        console.log('output-topic = ' + this.outputTopic);
        this.stream.mapJSONParse()
            .map(function (msg) {
            var decodedMessage = _this.parsedSchema.fromBuffer(msg.value.slice(0)); // Skip prefix.
            return {
                value: decodedMessage
            };
        })
            .map(function (msg) {
            if (datFieldArray[0] === 'date') {
                /*
                 * Convert all the date fields to their ISO equivalent which then
                 * allows comparison using normal operators.
                 */
                var fieldValue = new Date(msg.value[_this.minField]);
                var isoFieldValue = fieldValue.toISOString();
                msg.value[_this.minField] = isoFieldValue;
            }
            else if (datFieldArray[0] === 'number') {
                var fieldValue = Number(msg.value[_this.minField]);
                msg.value[_this.minField] = fieldValue;
            }
            return {
                value: msg.value
            };
        })
            .map(function (msg) {
            var o = msg.value[_this.minField];
            var current_min = _this.storage.get("min");
            current_min.then(function (m) {
                console.log("Current min: ", m);
            });
            _this.storage.setSmaller("min", o);
            return {
                value: _this.storage.get("min")
            };
        })
            .to(this.outputTopic, 1, 'buffer');
        //console.log(this.stream.getStorage().getMax());
        this.stream.start().then(function () {
            console.log("Stream 1 started, as kafka consumer is ready.");
        }, function (error) {
            console.log("Stream 1 failed to start: " + error);
        });
    };
    return MinAction;
}());
exports.MinAction = MinAction;
