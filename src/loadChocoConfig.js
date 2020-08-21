const fs = require('fs-extra');

const loadChocoConfig = async () => {
  try {
    const response = await fs.readJSON(
      '/Users/nuesslerm/.choco/config.json',
      'utf-8'
    );

    return response;
  } catch (err) {
    if (err) throw err;
  }
};

module.exports = { loadChocoConfig };
