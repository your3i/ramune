require('dotenv').config();

const {
    App
} = require('@slack/bolt');
const TextLintEngine = require('textlint').TextLintEngine;
const builder = require('./rules_builder.js');
const spreadsheet = 'https://docs.google.com/spreadsheets/d/1Y6aKcp2lI-pCz-dk-b-Lh921VnV5gUkjwdA4NJ0szjQ/edit#gid=681876907';

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN
});

const engine = new TextLintEngine();
builder.exec();



/*

[Commands]
- spreadsheet spreadsheetのURLを返す
- reload spreadsheetからルールをリロードする
*/

app.event('app_home_opened', ({
    event,
    say
}) => {
    var hello_message = 'こんにちは！コマンドはこちらです〜\n';
    hello_message += '\n`spreadsheet` spreadsheetのURLを返す';
    hello_message += '\n`reload` spreadsheetからルールをリロードする';
    say(hello_message);
});

app.event('app_mention', async({
    event,
    context
}) => {
    const message = event.text;
    const mention = `<@${context.botUserId}>`;
    const text = message.replace(mention, '');
    const report = await lint(text);

    var reply = {
        token: context.botToken,
        channel: event.channel,
        text: report
    };

    if (event.thread_ts !== undefined) {
        reply['thread_ts'] = event.thread_ts;
    }

    try {
        const result = await app.client.chat.postMessage(reply);
        console.log(result);
    } catch (error) {
        console.error(error);
    }
});

async function lint(text) {
    let results = await engine.executeOnText(text);
    var report = '';

    if (engine.isErrorResults(results)) {
        const output = engine.formatResults(results);
        report += '表記ゆれが見つかりました！👀';
        report += '\n```';
        results.forEach(function(element) {
            element.messages.forEach(function(message) {
                report += `\n${message.line}行目: ${message.message}`;
            });
        });
        report += '\n```';

    } else {
        report = '大丈夫そう！👍';
    }

    return report;
}

app.message('reload', async({
    message,
    say
}) => {
    builder.exec();
    say('ルールをリロードしました〜！🚀');
});

app.message('spreadsheet', async({
    message,
    say
}) => {
    var reply = 'スプレットシートはこちらです〜！👇';
    reply += '\n```';
    reply += `${spreadsheet}`;
    reply += '\n```';
    say(reply);
});

(async() => {
    await app.start(process.env.PORT || 4390);
    console.log('⚡️ Bolt app is running!');
})();
