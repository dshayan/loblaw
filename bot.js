require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');
const Anthropic = require('@anthropic-ai/sdk');

// Import configuration files
const aiConfig = require('./config/ai');
const strings = require('./config/strings');

// Initialize logging
const logFile = path.join(__dirname, 'logs', 'conversation.log');
// Create logs directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'logs'))) {
  fs.mkdirSync(path.join(__dirname, 'logs'));
}

// Function to log messages
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${message}\n`;
  
  // Log to console
  console.log(logEntry.trim());
  
  // Append to log file
  fs.appendFileSync(logFile, logEntry);
}

// Initialize the Telegram bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Get system prompt from file
const systemPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'system.txt'), 'utf8');

// Store conversation histories for each user
const conversations = {};

// Create keyboard with reset button
const resetKeyboard = Markup.keyboard([
  [strings.resetButtonText]
]).resize();

// Start command
bot.start((ctx) => {
  const userId = ctx.from.id;
  // Initialize or reset conversation for this user
  conversations[userId] = [];
  ctx.reply(strings.welcomeMessage, resetKeyboard);
});

// Restart command
bot.command(['restart', 'reset'], (ctx) => {
  const userId = ctx.from.id;
  // Reset conversation history for this user
  conversations[userId] = [];
  ctx.reply(strings.resetMessage, resetKeyboard);
});

// Handle reset button press
bot.hears(strings.resetButtonText, (ctx) => {
  const userId = ctx.from.id;
  // Reset conversation history for this user
  conversations[userId] = [];
  ctx.reply(strings.resetMessage, resetKeyboard);
});

// Handle messages
bot.on('text', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const userMessage = ctx.message.text;
    
    // Skip processing if it's the reset button text
    if (userMessage === strings.resetButtonText) {
      return;
    }
    
    // Initialize conversation array if it doesn't exist for this user
    if (!conversations[userId]) {
      conversations[userId] = [];
    }
    
    // Add user message to conversation history
    conversations[userId].push({ role: "user", content: userMessage });
    
    // Send a "typing" action to show the bot is processing
    ctx.sendChatAction('typing');
    
    logMessage(`Received message from user ${userId}: ${userMessage}`);
    
    // Call Claude API with the full conversation history
    const response = await anthropic.messages.create({
      model: aiConfig.claude.model,
      max_tokens: aiConfig.claude.max_tokens,
      system: systemPrompt,
      messages: conversations[userId]
    });
    
    // Add Claude's response to conversation history
    const claudeResponse = response.content[0].text;
    conversations[userId].push({ role: "assistant", content: claudeResponse });
    
    // Log Claude's response
    logMessage(`AI response to user ${userId}: ${claudeResponse}`);
    
    // Send the response back to the user with the reset keyboard
    ctx.reply(claudeResponse, resetKeyboard);
  } catch (error) {
    console.error('Error:', error);
    logMessage(`Error: ${error.message}`);
    ctx.reply(strings.errorMessage, resetKeyboard);
  }
});

// Launch the bot
bot.launch().then(() => {
  logMessage('Bot started successfully!');
}).catch((err) => {
  logMessage(`Error starting bot: ${err}`);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 