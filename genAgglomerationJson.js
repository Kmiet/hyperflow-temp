const fs = require('fs');
const path = require('path');

const workdir = './montageData';
const BUFFER_TIMEOUT = 2000;
const BUFFER_LIMIT = 500; // "inf"

const buffer = fs.readFileSync(path.join(workdir, 'workflow.json'));

(() => {
  const wfJson = JSON.parse(buffer);

  const procNames = {};
  const configContent = new Array();
  
  (wfJson.processes || []).forEach(({ name }) => {
    if (!procNames[name]) {
      procNames[name] = true;
      configContent.push({
        matchTask: [name],
        size: BUFFER_LIMIT,
        timeoutMs: BUFFER_TIMEOUT,
      });
    }
  })

  fs.writeFileSync(path.join(workdir, 'workflow.config.jobAgglomerations.json'), JSON.stringify(configContent));
})();