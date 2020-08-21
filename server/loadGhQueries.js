const axios = require('axios');
const db = require('./db');

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

const loadAccessToken = async () =>
  await db.gitHubStore.findOne({}, (err) => {
    if (err) throw err;
  });

const loadGhQueries = async () => {
  const accessToken = await loadAccessToken();

  if (!accessToken) return null;

  const response = await axios.post(
    'https://api.github.com/graphql',
    { query: gqlDocsQuery },
    { headers: { Authorization: `bearer ${accessToken}` } }
  );

  console.log(response.data.data.organization.repository.content.entries);

  return response.data.data.organization.repository.content.entries;
};

module.exports = loadGhQueries;
