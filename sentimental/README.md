[![Learn to code with TwilioQuest](https://img.shields.io/static/v1?label=TwilioQuest&message=Learn%20to%20code%21&color=F22F46&labelColor=1f243c&style=flat-square&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAASFBMVEUAAAAZGRkcHBwjIyMoKCgAAABgYGBoaGiAgICMjIyzs7PJycnMzMzNzc3UoBfd3d3m5ubqrhfrMEDu7u739/f4vSb/3AD///9tbdyEAAAABXRSTlMAAAAAAMJrBrEAAAKoSURBVHgB7ZrRcuI6EESdyxXGYoNFvMD//+l2bSszRgyUYpFAsXOeiJGmj4NkuWx1Qeh+Ekl9DgEXOBwOx+Px5xyQhDykfgq4wG63MxxaR4ddIkg6Ul3g84vCIcjPBA5gmUMeXESrlukuoK33+33uID8TWeLAdOWsKpJYzwVMB7bOzYSGOciyUlXSn0/ABXTosJ1M1SbypZ4O4MbZuIDMU02PMbauhhHMHXbmebmALIiEbbbbbUrpF1gwE9kFfRNAJaP+FQEXCCTGyJ4ngDrjOFo3jEL5JdqjF/pueR4cCeCGgAtwmuRS6gDwaRiGvu+DMFwSBLTE3+jF8JyuV1okPZ+AC4hDFhCHyHQjdjPHUKFDlHSJkHQXMB3KpSwXNGJPcwwTdZiXlRN0gSp0zpWxNtM0beYE0nRH6QIbO7rawwXaBYz0j78gxjokDuv12gVeUuBD0MDi0OQCLvDaAho4juP1Q/jkAncXqIcCfd+7gAu4QLMACCLxpRsSuQh0igu0C9Svhi7weAGZg50L3IE3cai4IfkNZAC8dfdhsUD3CgKBVC9JE5ABAFzg4QL/taYPAAWrHdYcgfLaIgAXWJ7OV38n1LEF8tt2TH29E+QAoDoO5Ve/LtCQDmKM9kPbvCEBApK+IXzbcSJ0cIGF6e8gpcRhUDogWZ8JnaWjPXc/fNnBBUKRngiHgTUSivSzDRDgHZQOLvBQgf8rRt+VdBUUhwkU6VpJ+xcOwQUqZr+mR0kvBUgv6cB4+37hQAkXqE8PwGisGhJtN4xAHMzrsgvI7rccXqSvKh6jltGlrOHA3Xk1At3LC4QiPdX9/0ndHpGVvTjR4bZA1ypAKgVcwE5vx74ulwIugDt8e/X7JgfkucBMIAr26ndnB4UCLnDOqvteQsHlgX9N4A+c4cW3DXSPbwAAAABJRU5ErkJggg==)](https://twilio.com/quest?utm_source=gh-badge&utm_medium=referral&utm_campaign=media-streams-devinar)

# Sentimental

This example application demonstrates the power of [Media Streams](https://twilio.com/media-streams) by forking audio from a call, transcribing it, and performing real-time sentiment analysis.

## Setup

Create a Google Application that has Google's [Speech to Text API](https://console.cloud.google.com/launcher/details/google/speech.googleapis.com) and the [Cloud Natural Language API](https://console.cloud.google.com/marketplace/product/google/language.googleapis.com) enabled.

Create credentials for a Service Account and save them as `google_creds.json` in the [folder](./) next to this `README.md` file.

Install and configure the server

```bash
npm install
npx configure
```

To run locally you'll need to open a port on your machine, so that Twilio can communicate. You can do this using [ngrok](https://ngrok.io).

```bash
ngrok http 3000
```

Run `cp .env.example .env` to create a `.env` file with the needed environment variables.

Update your `.env` file to contain your ngrok URL and the other needed variables. 

**Note:** `NODE_ENV` is set to `production` by default.

Set your incoming number to point to your ngrok url (or use the [Twilio Console](https://www.twilio.com/console/phone-numbers/incoming) to update your incoming number)

```bash
twilio phone-numbers:update +15558765 --voice-url=https://your-ngrok-url.ngrok.io/twiml
```
