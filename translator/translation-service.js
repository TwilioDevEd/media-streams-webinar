const EventEmitter = require("events");
const {
  SpeechTranslationServiceClient,
} = require("@google-cloud/media-translation");

const { TextToSpeechClient } = require("@google-cloud/text-to-speech");
const { WaveFile } = require("wavefile");

class TranslatorService extends EventEmitter {
  constructor(sourceLanguage) {
    super();
    this.client = new SpeechTranslationServiceClient();
    this.ttsClient = new TextToSpeechClient();
    this.stream = null;
    this.config = {
      audioConfig: {
        audioEncoding: "mulaw",
        sampleRateHertz: 8000,
        model: "google-provided-model/phone-call",
        sourceLanguageCode: sourceLanguage,
        targetLanguageCode: sourceLanguage,
      },
      singleUtterance: true,
    };
    this.currentTranslation = "";
    this.isFirst = true;
  }

  setTargetLanguage(language) {
    this.config.audioConfig.targetLanguageCode = language;
  }

  sendAudio(payload) {
    if (this.stream === null || this.stream.destroyed) {
      this.isFirst = true;
      this.stream = this.client
        .streamingTranslateSpeech()
        .on("error", (e) => {
          if (e.code && e.code === 4) {
            console.log("Streaming translation reached its deadline.");
          } else {
            console.error(e);
          }
        })
        .on("data", (response) => {
          const { result, speechEventType } = response;
          if (speechEventType === "END_OF_SINGLE_UTTERANCE") {
            console.log(`\nFinal translation: ${this.currentTranslation}`);
            this.emit("translation", this.currentTranslation);
            this.createAudio(this.currentTranslation)
              .then(audio => {
                this.emit("audio", audio);
                this.stream.destroy();
              });
            // TODO: Synthesize Speech
            // TODO: Emit the result
            this.stream.destroy();
          } else {
            this.currentTranslation = result.textTranslationResult.translation;
            console.log(`\nPartial translation: ${this.currentTranslation}`);
          }
        });
    }
    if (this.isFirst) {
      // Send the initial request
      this.stream.write({
        streamingConfig: this.config,
        audioContent: null,
      });
      this.isFirst = false;
    }
    this.stream.write({
      streamingConfig: this.config,
      audioContent: payload,
    });
  }

  async createAudio(text) {
    const request = {
      input: { text },
      voice: { languageCode: this.config.audioConfig.targetLanguageCode },
      // select the type of audio encoding
      audioConfig: { audioEncoding: "LINEAR16" },
    };
    const [response] = await this.ttsClient.synthesizeSpeech(request);
    // AudioContent is Base64 encoded
    const wav = new WaveFile();
    wav.fromBuffer(response.audioContent);
    wav.toSampleRate(8000);
    wav.toMuLaw();
    // Do not send the WAV headers
    return Buffer.from(wav.data.samples).toString("base64");
  }

  finish() {
    console.log("TranslatorService is finishing");
    this.stream.destroy();
  }
}

module.exports = TranslatorService;
