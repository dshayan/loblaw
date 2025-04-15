# loblaw

A simple Telegram bot that forwards user messages to Anthropic's Claude AI and returns the responses.

## Setup

1. Make sure you have Node.js installed on your system.

2. Install the dependencies:
```
npm install
```

3. Set up your environment variables in the `.env` file:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot Token

### Getting a Telegram Bot Token

1. Open Telegram and search for the BotFather (@BotFather)
2. Start a chat with BotFather and send the command `/newbot`
3. Follow the instructions to create a new bot
4. Copy the token into your `.env` file as `TELEGRAM_BOT_TOKEN`

## Usage

1. Start the bot: `npm start`
2. Open Telegram and search for your bot by the username you gave it
3. Start a chat and send any message to get AI responses

## Customization

- You can modify the system prompt in the `prompts/system.txt` file 