require('dotenv').config();

const { App } = require('@slack/bolt');
const TextLintEngine = require("textlint").TextLintEngine;
const path = require("path");
const builder = require("./rules_builder.js");

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN
});

const engine = new TextLintEngine();

builder.exec();

app.event('app_home_opened', ({ event, say }) => {
  say('hiiii!');
  // say({
  //   blocks:[{
  //     "type": "section",
  //     "text": {
  //       "type": "mrkdwn",
  //       "text": "Hello!"
  //     }
  //   },
  //   {
  //     "type": "divider"
  //   },
  //   {
  //     "type": "actions",
  //     "elements": [
  //       {
  //         "type": "button",
  //         "text": {
  //           "type": "plain_text",
  //           "text": "Rebuild rules",
  //           "emoji": true
  //         },
  //         "action_id": "action_rebuild_rules"
  //       }
  //     ]
  //   }]
  // });
});

// app.action('action_rebuild_rules', async ({ ack, say }) => {
//   ack();
//   say('ok');
// });

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
  await app.start(process.env.PORT || 4390);
  console.log('⚡️ Bolt app is running!');
})();

