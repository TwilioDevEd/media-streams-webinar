const EventEmitter = require("events");
const Speech = require("@google-cloud/speech");
const speech = new Speech.SpeechClient();

const request = {
  config: {
    encoding: "MULAW",
    sampleRateHertz: 8000,
    languageCode: "en-US",
  },
  interimResults: true,
};

class TranscriptionService extends EventEmitter {
  constructor() {
    super();
    this.stream = null;
    this.refreshStream = true;
  }

  send(payload) {
    this.getStream().write(payload);
  }

  close() {
    if (this.stream) {
      this.stream.destroy();
    }
  }

  getStream() {
    if (this.refreshStream) {
      if (this.stream) {
        this.stream.destroy();
      }
      console.log("Creating new stream");
      this.stream = speech
        .streamingRecognize(request)
        .on("error", console.error)
        .on("data", (data) => {
          const result = data.results[0];
          if (result === undefined || result.alternatives[0] === undefined) {
            return;
          }
          if (result.isFinal === true) {
            this.emit("transcription", result.alternatives[0].transcript);
            if (this.refreshTimeout) {
              this.refreshStream = true;
              clearTimeout(this.refreshTimeout);
            }
          } else {
            // console.log(`Partial result: ${result.alternatives[0].transcript}`);
          }
        });
      this.refreshStream = false;
      // And make sure we refresh it every 60 seconds
      this.refreshTimeout = setTimeout(() => {
        console.log("Marking stream");
        this.refreshStream = true;
      }, 60000);
    }
    return this.stream;
  }
}

module.exports = TranscriptionService;
