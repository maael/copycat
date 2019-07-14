FROM mhart/alpine-node:11 as build
WORKDIR /repo
COPY . .
RUN yarn
RUN yarn build
RUN yarn install --production --ignore-scripts --prefer-offline

FROM mhart/alpine-node:base-11
WORKDIR /repo
COPY --from=build /repo .

EXPOSE 3000
EXPOSE 3030

CMD ["/repo/node_modules/.bin/concurrently", "-n", "io,next", "\"node /repo/server/dist/io.js\"", "\"/repo/node_modules/.bin/next start\""]
