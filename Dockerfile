FROM node:8.9-alpine
ENV HOME=/home/nupp 
RUN adduser node root 
WORKDIR $HOME/app
COPY package.json $HOME/app/
COPY ./ $HOME/app/
RUN npm install -g typescript
RUN apk add --update openssl
RUN apk add --update bash
RUN apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++ \
    && npm install \
    && apk del build-dependencies
RUN chown -R node $HOME/*
RUN chmod +x $HOME/app/runner/run_min_action.sh
USER node
RUN tsc $HOME/app/lib/MinAction.ts 
CMD $HOME/app/runner/run_min_action.sh

