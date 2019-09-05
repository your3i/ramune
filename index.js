require('dotenv').config();

const {
    App
} = require('@slack/bolt');
const TextLintEngine = require('textlint').TextLintEngine;
const builder = require('./rules_builder.js');

const spreadsheet = 'https://docs.google.com/spreadsheets/d/1Y6aKcp2lI-pCz-dk-b-Lh921VnV5gUkjwdA4NJ0szjQ/edit#gid=681876907';
const mention = '@ramune';

const command = {
    help: '--help',
    spreadsheet: '--spreadsheet',
    reload: '--reload'
}

const helpMessage = `
\`\`\`
${mention} (text) で表記ゆれチェックを行います。
${mention} (--command) でコマンドを実行します。

${command.help}: ヘルプ
${command.spreadsheet}: スプレットシートのリンクをみる
${command.reload}: スプレットシートからルールをリロードする
\`\`\`
`;

const spreadsheetMessage = `
スプレットシートはこちらです〜！👇
\`\`\`
${spreadsheet}
\`\`\`
`;

const reloadMessage = `ルールをリロードしました〜！🚀`;

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN
});

const engine = new TextLintEngine();
builder.exec();

app.event('app_mention', async({
    event,
    context
}) => {
    const message = event.text;
    const mention = `<@${context.botUserId}>`;
    const text = message.replace(mention, '');

    var response = '';

    switch (text.trim()) {
        case ``:
        case `${command.help}`:
            response = helpMessage;
            break;
        case `${command.spreadsheet}`:
            response = spreadsheetMessage;
            break;
        case `${command.reload}`:
            builder.exec();
            response = reloadMessage;
            break;
        default:
            response = await lint(text);
    }

    var reply = {
        token: context.botToken,
        channel: event.channel,
        text: response
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

(async() => {
    await app.start(process.env.PORT || 4390);
    console.log('⚡️ Bolt app is running!');
})();
