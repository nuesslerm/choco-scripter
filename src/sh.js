const exec = require('await-exec');

async function sh(cmd) {
  try {
    await exec(cmd);
  } catch (err) {
    throw new Error(err);
  }
}

module.exports = { sh };
