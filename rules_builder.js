const gsjson = require('google-spreadsheet-to-json');
const yaml = require('js-yaml');
const fs = require('fs');

const prh_file = './prh.yml';

const sheets = [2, 3];

exports.exec = function() {
  var outputs = [];
  
  for(let i = 0; i < sheets.length; i++) {
      const sheetId = sheets[i];
      const output = "./prh-rules/" + sheetId + ".yml"
	  outputs.push(output);
      
      gsjson({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        worksheet: sheetId,
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
};

function buildYmlRuleFile(data, output) {
  var rules = [];
  
  for (const json of data) {
	if (json.wrongPatterns === undefined) {
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
  
  fs.writeFile(output, content, { encoding: 'utf8', flag: 'w+' }, function(err) {
    if(err) {
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
  
  fs.writeFile(prh_file, content, { encoding: 'utf8', flag: 'w+' }, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log(`${prh_file} is populated!`);
  });
}