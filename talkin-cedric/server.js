require("dotenv").config();
const express = require("express");
const expressWebSocket = require("express-ws");
const websocketStream = require("websocket-stream/stream");
const Twilio = require("twilio");
const TranscriptionService = require("./transcription-service");

const PORT = process.env.PORT || 3000;

const app = express();
// extend express app with app.ws()
expressWebSocket(app, null, {
  perMessageDeflate: false,
});

app.ws("/audio", (ws, req) => {
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
  const transcriptionService = new TranscriptionService();

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
    transcriptionService.send(msg.media.payload);
  });

  mediaStream.on("finish", () => {
    console.log("MediaStream has finished");
    transcriptionService.close();
  });

  transcriptionService.on("transcription", (transcription) => {
    const twiml = new Twilio.twiml.VoiceResponse();
    twiml.say(
      {
        voice: "Polly.Brian-Neural",
        language: "en-GB",
      },
      transcription
    );
    twiml.pause({ length: 120 });
    return client
      .calls(callSid)
      .update({ twiml: twiml.toString() })
      .then((call) =>
        console.log(`Updated Call(${callSid}) with twiml: ${twiml.toString()}`)
      )
      .catch((err) => console.error(err));
  });
});

const listener = app.listen(PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
