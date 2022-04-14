const express = require("express");
const app = express();
const expressWs = require('express-ws')(app);
const port = 8080;

let turtles = new Set([{id: 1, name: "a"}, {id: 2, name: "b"}])
let altTurtles = new Set([{id: 2, name: "b"}, {id: 3, name:"c"}, {id: 4, name:"d"}])

app.ws("/", (ws, req) => {
  console.log("Irgendein Hirt ist jetzt a dabei");
  user = ws;

  ws.on("message", msg => {
    try {
        const parsedMessage = JSON.parse(msg);
        console.log(parsedMessage);
        if (parsedMessage.type === "get") {
            ws.send(JSON.stringify({type: "full", turtles: [...turtles]}))
            //ws.send(JSON.stringify({type: "hi", turtle: {id: 3, name:"c"}}))
            //ws.send(JSON.stringify({type: "full", turtles: [...altTurtles]}))
            ws.send(JSON.stringify({type: "hi", turtle: {id: 2, name:"b"}}))
        }
    } catch {}
  });

  ws.on("close", e => {
    console.log("Irgendein Hirt ist jetzt nima dabei");
    user = undefined;
  });
  
});

app.listen(port, () => {
  console.log("Server listening on port:", port);
});

