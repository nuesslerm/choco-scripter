const fs = require('fs-extra');

const loadChocoConfig = async () => {
  try {
    return await fs.readJSON('/Users/nuesslerm/.choco/config.json', 'utf-8');
  } catch (err) {
    if (err) throw err;
  }
};

module.exports = { loadChocoConfig };
