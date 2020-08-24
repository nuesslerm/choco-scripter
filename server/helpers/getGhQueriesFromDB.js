const db = require('../db');

const getGhQueriesFromDB = async () => {
  try {
    const { queries } = await db.queriesStore.findOne({}, (err) => {
      throw new Error(err);
    });

    const allMutations = {};
    const allQueries = {};

    queries.map((entry) => {
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

module.exports = getGhQueriesFromDB;
