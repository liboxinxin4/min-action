const MinAction = require("./lib/MinAction");
const fs = require("fs");

require('dotenv').config()

const schemaName = process.env.TOPIC_SCHEMA_NAME;
const inputTopic = process.env.SKYLINE_INPUT_TOPIC;
const outputTopic = process.env.SKYLINE_OUTPUT_TOPIC;
const errTopic = process.env.SKYLINE_ERROR_TOPIC;
const minFieldName = process.env.MIN_FIELD_NAME;
const minFieldType = process.env.MIN_FIELD_TYPE;

try {
    let s = fs.readFileSync(__dirname+"/asset/"+schemaName).toString();

    if (inputTopic && outputTopic && errTopic && minFieldName) {
        let minAction = new MinAction.MinAction(inputTopic, outputTopic, errTopic, minFieldName, s);
        minAction.execute([minFieldType]);
    } else {
        console.log("Fail to find environment variable")
    }
} catch (ex) {
    console.log("Exception: ", ex)
}