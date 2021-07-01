require("dotenv").config();
const express = require("express");
const expressWebSocket = require("express-ws");
const websocketStream = require("websocket-stream/stream");
const Twilio = require("twilio");
const SentimentService = require("./sentiment-service");

const PORT = process.env.PORT || 3000;

const app = express();
// extend express app with app.ws()
expressWebSocket(app, null, {
  perMessageDeflate: false,
});

app.post("/twiml", (req, res) => {
  const twiml = new Twilio.twiml.VoiceResponse();
  twiml
    .start()
    .stream({
      url: `wss://${process.env.SERVER_HOSTNAME}/audio`,
      track: "both_tracks"
    });
  twiml.dial(process.env.OUTBOUND_NUMBER);
  res.type("xml");
  return res.send(twiml.toString());
});

app.ws("/audio", (ws, req) => {
  console.log("Websocket connected");
  let client;
  try {
    client = new Twilio();
  } catch (err) {
    if (process.env.TWILIO_ACCOUNT_SID === undefined) {
      console.error(
        "Ensure that you have set your environment variable TWILIO_ACCOUNT_SID. This can be copied from https://twilio.com/console"
      );
      console.log("Exiting");
      return;
    }
    console.error(err);
  }
  // This will get populated from the start message
  let callSid;
  // MediaStream coming from Twilio
  const mediaStream = websocketStream(ws, {
    binary: false,
  });
  const trackHandlers = {};

  mediaStream.on("data", (data) => {
    const msg = JSON.parse(data);
    if (msg.event === "start") {
      callSid = msg.start.callSid;
      console.log(`Call ${callSid} is happening`);
    }
    if (msg.event !== "media") {
      // We're only concerned with media messages
      return;
    }
    const track = msg.media.track;
    if (trackHandlers[track] === undefined) {
      const sentimentService = new SentimentService(track);
      sentimentService.on("sentiment", (sentiment) => {
        console.log("Received sentiment from service!");
        console.dir(sentiment);
      });
      trackHandlers[track] = sentimentService;
    }
    trackHandlers[track].sendAudio(msg.media.payload);
  });

  mediaStream.on("finish", () => {
    console.log("MediaStream has finished");
    Object.values(trackHandlers).forEach(handler => {
      handler.close();
    });
  });
});

const listener = app.listen(PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
  console.log(`Server hostname from .env: ${process.env.SERVER_HOSTNAME}`);
});
