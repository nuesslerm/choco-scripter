const axios = require('axios');
const db = require('../db');

const getAccessToken_DB = require('./getAccessToken_DB'); // async function

const gqlDocsQuery = `query {
  organization(login: "chocoapp") {
    repository(name: "choco-appsync") {
      content: object(expression: "master:packages/client/src/documents") {
        ... on Tree {
          entries {
            name
            object {
              ... on Tree {
                entries {
                  name
                  object {
                    ... on Blob {
                      text
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

const loadGhQueries = async () => {
  const accessToken = await getAccessToken_DB();

  if (!accessToken) return null;

  const response = await axios.post(
    'https://api.github.com/graphql',
    { query: gqlDocsQuery },
    { headers: { Authorization: `bearer ${accessToken}` } }
  );

  try {
    await db.queriesStore.update(
      { __id: 'queries' },
      {
        __id: 'queries',
        queries: response.data.data.organization.repository.content.entries,
      },
      { upsert: true }
    );
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = loadGhQueries;
