FROM node:22-alpine3.21

ENV USER=application
ENV GROUPNAME=$USER
ENV UID=10001
ENV GID=10001

RUN addgroup \
    --gid "$GID" \
    "$GROUPNAME" && \
    adduser \
    --disabled-password \
    --ingroup "$GROUPNAME" \
    --no-create-home \
    --uid "$UID" \
    $USER

WORKDIR /home/node/app/src/app.js
COPY --chown=$UID:$GID . .
RUN npm ci && \
    chown -R $UID:$GID node_modules 
EXPOSE 9130
USER $UID

CMD [ "node", "app.js" ]