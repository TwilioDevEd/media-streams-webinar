require("dotenv").config();
const express = require("express");
const expressWebSocket = require("express-ws");
const websocketStream = require("websocket-stream/stream");
const Twilio = require("twilio");
const TranslationService = require("./translation-service");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.urlencoded({ extended: true }));

// extend express app with app.ws()
expressWebSocket(app, null, {
  perMessageDeflate: false,
});

const languages = [	
  { language: "ja-JP", name: "Japanese" },
  { language: "es-MX", name: "Spanish" },
];

app.post("/twiml", (req, res) => {
  res.type("xml");
  let twiml;
  if (req.body.Digits === undefined) {
    const options = languages.map(
      (value, index) => `Press ${index + 1} for ${value.name}.`
    );
    twiml = `
    <Response>
      <Gather numDigits="1">
        <Say>${options.join(" ")}</Say>
      </Gather>
    </Response>
    `;
  } else {
    const value = languages[req.body.Digits - 1];
    twiml = `
      <Response>
        <Say>Translating to ${value.name}</Say>
        <Connect>
          <Stream url="wss://${process.env.SERVER_HOSTNAME}/audio">
            <Parameter name="translateTo" value="${value.language}" />
          </Stream>
        </Connect>
      </Response>
    `;
  }
  res.send(twiml);
});

app.ws("/audio", (ws, req) => {
  console.log("Websocket connected");
  // This will get populated from the start message
  let callSid;
  let streamSid;
  // MediaStream coming from Twilio
  const mediaStream = websocketStream(ws, {
    binary: false,
  });
  const translationService = new TranslationService("en-US");
  mediaStream.on("data", (data) => {
    const msg = JSON.parse(data);
    if (msg.event === "start") {
      callSid = msg.start.callSid;
      streamSid = msg.start.streamSid;
      console.log(`Call ${callSid} is happening`);
      const translateTo = msg.start.customParameters.translateTo;
      console.log({ translateTo });
      // TODO: Allow changing of target language
      translationService.setTargetLanguage(translateTo);
    }
    if (msg.event !== "media") {
      // We're only concerned with media messages
      return;
    }
    translationService.sendAudio(msg.media.payload);
    
  });

  translationService.on("translation", (translation) => {
    console.log(`Server got back: ${translation}`);
  });

  translationService.on("audio", (audio) => {
    const mediaMessage = {
      streamSid,
      event: "media",
      media: {
        payload: audio
      }
    };
    const mediaJSON = JSON.stringify(mediaMessage);
    console.log(`Sending audio (${audio.length} characters)`);
    mediaStream.write(mediaJSON);
  });

  mediaStream.on("finish", () => {
    console.log("MediaStream has finished");
    translationService.finish();
  });
});

app.use((error, req, res, next) => {
  res.status(500)
  res.send({error: error})
  console.error(error.stack)
  next(error)
})

const listener = app.listen(PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
  console.log(`Server hostname from .env: ${process.env.SERVER_HOSTNAME}`);});
