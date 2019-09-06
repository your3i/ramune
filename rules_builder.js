const gsjson = require('google-spreadsheet-to-json');
const GoogleSpreadsheet = require('google-spreadsheet');
const yaml = require('js-yaml');
const fs = require('fs');

const spreadsheet = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);
const prh_file = './prh.yml';

exports.exec = function() {
    spreadsheet.getInfo(function(error, info) {
        var outputs = [];
        const sheets = info.worksheets;

        if (error) {
            console.log('Error: ' + error);
            return;
        }

        for (let i = 0; i < sheets.length; i++) {
            const sheet = sheets[i];

            if (sheet.title.startsWith('_')) {
                continue;
            }

            const output = "./prh-rules/" + sheet.title + ".yml";
            outputs.push(output);

            gsjson({
                    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
                    worksheet: sheet.title,
                    beautify: false
                })
                .then(function(result) {
                    // console.log(result.length);
                    // console.log(result);
                    buildYmlRuleFile(result, output);
                })
                .catch(function(err) {
                    console.log(err.message);
                    console.log(err.stack);
                });
        }

        importRuleFiles(outputs);
    });
};

function buildYmlRuleFile(data, output) {
    var rules = [];

    for (const json of data) {
        if (json.wrongPatterns === undefined) {
            continue;
        }
        if (json.wrongPatterns.includes('-')) {
            continue;
        }
        var patterns = json.wrongPatterns.split(',').map(x => x.trim());
        var rule = {
            "expected": json.term,
            "patterns": patterns
        };
        rules.push(rule);
    }

    const content = yaml.safeDump({
        "imports": [],
        "rules": rules
    });

    fs.writeFile(output, content, {
        encoding: 'utf8',
        flag: 'w+'
    }, function(err) {
        if (err) {
            return console.log(err);
        }
        console.log(`${output} is generate!`);
    });
};

function importRuleFiles(ymls) {
    var content = yaml.safeDump({
        "version": 1,
        "imports": ymls
    });

    fs.writeFile(prh_file, content, {
        encoding: 'utf8',
        flag: 'w+'
    }, function(err) {
        if (err) {
            return console.log(err);
        }

        console.log(`${prh_file} is populated!`);
    });
}
