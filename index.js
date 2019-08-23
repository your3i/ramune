const { App } = require('@slack/bolt');
const TextLintEngine = require("textlint").TextLintEngine;
const path = require("path");

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN
});

const engine = new TextLintEngine();

app.event('app_home_opened', ({ event, say }) => {
  say(`hi`);
});

app.message(/.*/, ({ message, say }) => {
  let results = engine.executeOnText(message.text).then(function(results){
    if (engine.isErrorResults(results)) {
      const output = engine.formatResults(results);
      
      var lintResult = '```';
      results.forEach(function(element) {
        element.messages.forEach(function(message) {
          lintResult += `\n${message.line}行目: ${message.message}`;
        });
      });
      lintResult += '\n```';
      say(lintResult)
    } else {
      say("All Passed!");
    }
  });
});

// Start your app
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();

