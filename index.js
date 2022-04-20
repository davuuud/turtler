const express = require("express");
const app = express();
const expressWs = require('express-ws')(app);
const port = 8080;

const turtles = [{id: 1, name: "a"},{id: 2, name: "b"},{id: 3, name:"c"},{id: 4, name:"d"},{id: 5, name:"e"},{id: 6, name:"f"},{id: 7, name:"g"},{id: 8, name:"h"},{id: 9, name:"i"},{id: 10, name:"j"},{id: 11, name:"k"},{id: 12, name:"l"},{id: 13, name:"m"},{id: 14, name:"n"},{id: 15, name:"o"},{id: 16, name:"p"},{id: 17, name:"q"},{id: 18, name:"r"}]

app.ws("/", (ws, req) => {
  console.log("Irgendein Hirt ist jetzt a dabei");
  user = ws;

  ws.on("message", msg => {
    try {
        const parsedMessage = JSON.parse(msg);
        console.log(parsedMessage);
        if (parsedMessage.type === "get") {
            ws.send(JSON.stringify({type: "full", turtles: turtles}))
            //ws.send(JSON.stringify({type: "bye", turtle: {id: 3, name:"c"}}))
        }
    } catch {}
  });

  ws.on("close", e => {
    console.log("Irgendein Hirt ist jetzt nima dabei");
    user = undefined;
  });
  
});

// app.ws("/turtle", (ws, req) => {
//   console.log("Irgendeine Turtle ist jetzt a dabei");
//   turtle = ws;

//   ws.on("message", msg => {
//     const parsedMessage = JSON.parse(msg);
//     console.log(parsedMessage);
//     if (typeof turtle !== 'undefined') {
//       user.send(msg);
//     }  
//   });

//   ws.on("close", e => {
//     console.log("Irgendeine Turtle ist jetzt nima dabei");
//     turtle = undefined;
//   });
  
// });

app.listen(port, () => {
  console.log("Server listening on port:", port);
});

/*
Handle connections with turtles
Handle connection with users
Status message to users (new turtle, turtle gone or block update with subscription)
database
*/