#!/bin/bash

USER=${PRINCIPAL}@${DOMAIN}
KEYTAB=/etc/conf/${PRINCIPAL}.keytab
export SKYLINE_INPUT_TOPIC=${SKYLINE_INPUT_TOPIC}
export SKYLINE_OUTPUT_TOPIC=${SKYLINE_OUTPUT_TOPIC}
export SKYLINE_ERROR_TOPIC=${SKYLINE_ERROR_TOPIC}
export HOSTNAME=${HOSTNAME}
 
echo "INPUT_TOPIC as set in shell ${SKYLINE_INPUT_TOPIC}"
echo "OUTPUT_TOPIC as set in shell ${SKYLINE_OUTPUT_TOPIC}"
echo "ERROR_TOPIC as set in shell ${SKYLINE_ERROR_TOPIC}"
 
node ../index.js                                     
