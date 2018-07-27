"use strict";

import {KafkaStreams} from "kafka-streams";
import {KStorage} from "kafka-streams";
import {Type} from "avsc";
import * as avro from 'avsc';

/**
 * Action to get maximum value from a stream of records. The minField parameter denotes 
 * the field that the naximum value will be selected from.
 */

const batchOptions = {
    batchSize: 5,
    commitEveryNBatch: 1,
    concurrency: 1,
    commitSync: false,
    noBatchCommits: false
};

import uuidv4 = require('uuid/v4');
var gid = uuidv4();

const nativeConfig = {
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


export class MinAction {
    private kafkaStreams: any;
    private stream: any;
    private parsedSchema: Type;
    private storage: any;

    constructor(private inputTopic: string, 
                private outputTopic: string, 
                private errTopic: string, 
                private minField: string, 
                schema: string) {
        this.kafkaStreams = new KafkaStreams(nativeConfig);
        this.storage = new KStorage();
        this.storage.set("min", 0);
        this.stream = this.kafkaStreams.getKStream(this.inputTopic, this.storage);
        this.parsedSchema = avro.Type.forSchema(JSON.parse(schema));
    }

    public execute( datFieldArray: any) {
        console.log('input-topic = ' + this.inputTopic);
        console.log('output-topic = ' + this.outputTopic);
        this.stream.mapJSONParse()
                   .map((msg: any) => {
                        let decodedMessage = this.parsedSchema.fromBuffer(msg.value.slice(0)); // Skip prefix.
                        return {
                            value: decodedMessage
                        }; 
                    })
                    .map((msg: any) => {
                        if(datFieldArray[0] === 'date') {
                            /*
                             * Convert all the date fields to their ISO equivalent which then
                             * allows comparison using normal operators.
                             */
                            let fieldValue = new Date(msg.value[this.minField]);
                            let isoFieldValue = fieldValue.toISOString();
                            msg.value[this.minField] = isoFieldValue;
                        } else if (datFieldArray[0] === 'number'){
                            let fieldValue = Number(msg.value[this.minField]);
                            msg.value[this.minField] = fieldValue;
                        }
                        return {
                            value: msg.value
                        }; 
                    })
                    .map((msg: any) =>  { 
                        let o = msg.value[this.minField];
                        let current_min = this.storage.get("min");
                        current_min.then((m) => {
                            console.log("Current min: ", m);
                        });
                        this.storage.setSmaller("min", o);
                        return {
                         value: this.storage.get("min")
                         }; 
                     })
                   .to(this.outputTopic, 1, 'buffer');

        //console.log(this.stream.getStorage().getMax());

        this.stream.start().then(() => {
            console.log("Stream 1 started, as kafka consumer is ready.");
        }, (error: any) => {
            console.log("Stream 1 failed to start: " + error);
        });
    }
}