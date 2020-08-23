const fs = require('fs-extra');

const loadQueriesFromStore = async () => {
  try {
    const response = await fs.readFile('database/queriesStore.db', 'utf-8');

    const allMutations = {};
    const allQueries = {};

    const { entries } = JSON.parse(response);

    entries.map((entry) => {
      if (entry.name === 'mutation') {
        entry.object.entries.map((subEntry) => {
          const name = subEntry.name && subEntry.name.replace('.graphql', '');
          allMutations[name] = subEntry.object.text;
        });
      } else if (entry.name === 'query') {
        entry.object.entries.map((subEntry) => {
          const name = subEntry.name && subEntry.name.replace('.graphql', '');
          allQueries[name] = subEntry.object.text;
        });
      }
    });

    return { mutation: allMutations, query: allQueries };
  } catch (err) {
    return null;
  }
};

module.exports = { loadQueriesFromStore };
