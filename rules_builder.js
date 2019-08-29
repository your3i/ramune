const gsjson = require('google-spreadsheet-to-json');
const YAML = require('yamljs');
const fs = require('fs');

const sheets = [2, 3];

exports.exec = function() {
  var outputs = [];
  
  for(let i = 0; i < sheets.length; i++) {
      const sheetId = sheets[i];
      const output = "./prh-rules/" + sheetId + ".yml"
      
      gsjson({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        worksheet: sheetId,
        beautify: false
      })
      .then(function(result) {
          // console.log(result.length);
          // console.log(result);
          jsonToYml(result, output);
          outputs.push(output);
        
          if (i === sheets.length - 1) {
            console.log('ok');
            importRules(outputs);
          }
      })
      .catch(function(err) {
          console.log(err.message);
          console.log(err.stack);
      });
    }
};

function jsonToYml(data, output) {
  var rules = [];
  
  for (const json of data) {
    var patterns = [];
    
    if (json.wrongPatterns != undefined) {
      patterns = json.wrongPatterns.split(',').map(x => x.trim());
    }
    
    const rule = {
      "expected": json.term,
      "patterns": patterns
    };
    
    rules.push(rule);
  }
  
  var content = YAML.stringify({
    "imports": [],
    "rules": rules
  });
  
  console.log(content);
  
  fs.writeFile(output, content, { encoding: 'utf8', flag: 'w+' }, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
  });
};

function importRules(ymls) {
  var content = YAML.stringify({
    "version": 1,
    "imports": ymls
  });
  
  console.log(content);
  
  fs.writeFile('./prh.yml', content, { encoding: 'utf8', flag: 'w+' }, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
  });
}