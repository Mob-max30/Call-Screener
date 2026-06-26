const WebSocket = require("ws");

const wss = new WebSocket.Server({
  port: 3001,
});

console.log("🚀 WebSocket server running on port 3001");

wss.on("connection", (ws) => {
  console.log("✅ Frontend connected!");

  ws.send(
    JSON.stringify({
      message: "Hello Frontend!",
    })
  );

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(
        message.toString()
      );

      if (data.realtimeInput) {
        console.log(
          "🎤 Audio chunk received"
        );
      } else {
        console.log(
          "Received:",
          data
        );
      }
    } catch (err) {
      console.log(
        "Received raw message:",
        message.toString()
      );
    }
  });

  ws.on("close", () => {
    console.log(
      "🔌 Frontend disconnected"
    );
  });
});