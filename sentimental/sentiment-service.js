const EventEmitter = require("events");
// Imports the Google Cloud client library
const { LanguageServiceClient } = require("@google-cloud/language");

const TranscriptionService = require("./transcription-service");

const client = new LanguageServiceClient();

class SentimentService extends EventEmitter {
  constructor(label) {
    super();
    this.label = label;
    this.languageServiceClient = new LanguageServiceClient();
    this.transcriptionService = new TranscriptionService();
    this.transcriptionService.on("transcription", (transcription) => {
      this.sendSentiment(transcription);
    });
  }

  sendAudio(payload) {
    this.transcriptionService.send(payload);
  }

  sendSentiment(text) {
    const document = {
      content: text,
      type: "PLAIN_TEXT",
    };

    // Detects the sentiment of the text
    client
      .analyzeSentiment({ document })
      .then((results) => {
        const result = results[0];
        // Break each sentence out and display the score
        // Magnitude is in reference to the entire "document", which here is irrelevant due to the realtime nature
        result.sentences.forEach(sentence => {
          this.emit("sentiment", {
            label: this.label,
            score: sentence.sentiment.score,
            text: sentence.text.content
          });
        });
      })
      .catch((err) => console.error(err));
  }
  
  close() {
    console.log("Closing transcription service");
    this.transcriptionService.close();
  }
}

module.exports = SentimentService;
