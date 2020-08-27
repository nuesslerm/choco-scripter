const fs = require('fs-extra');
const os = require('os');

const loadChocoConfig = async () => {
  try {
    return await fs.readJSON(`${os.homedir}/.choco/config.json`, 'utf8');
  } catch (err) {
    if (err) throw err;
  }
};

module.exports = loadChocoConfig;
