import * as fetch from 'node-fetch';
import * as path from 'path';
import { Configs } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions';
import { getEnv } from '../../utils';

interface IGithubInfo {
  abbreviatedOid: string;
  oid: string;
  message: string;
  committedDate: string;
  committer: {
    name: string;
    date: string;
  };
  author: {
    name: string;
    date: string;
  };
}

const repoQuery = (repoName: string): string => {
  return `
    query { 
      repository(owner: "erxes", name: "${repoName}") { 
        object(expression: "develop") {
          ...on Commit {
            history(first: 1) {
              edges {
                node {
                  abbreviatedOid
                  oid
                  message
                  committedDate
                  committer {
                    name
                    date
                  }
                  author {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
};

const GITHUB_ACCESS_TOKEN = getEnv({ name: 'GITHUB_ACCESS_TOKEN', defaultValue: '' });
const GITHUB_GRAPHQL_URL = getEnv({ name: 'GITHUB_GRAPHQL_URL', defaultValue: '' });

const getGitInfos = async (repoName: string, projectPath: string) => {
  let packageVersion: string = 'N/A';

  try {
    packageVersion = require(path.join(projectPath, 'package.json')).version;
  } catch (e) {
    return;
  }

  const options = {
    headers: { Authorization: `Bearer ${GITHUB_ACCESS_TOKEN}` },
    method: 'POST',
  };

  const query = JSON.stringify({ query: repoQuery(repoName) });
  const fetchOptions = { ...options, body: query };

  const qryResponse = await new Promise((resolve, reject) => {
    return fetch(GITHUB_GRAPHQL_URL, fetchOptions)
      .then(res => res.json())
      .then(res => {
        const { data = {} } = res;
        const { repository = {} } = data;
        const { object = {} } = repository;
        const { history = {} } = object;
        const { edges = [] } = history;
        const [firstNode = {}] = edges;
        const { node = {} } = firstNode;

        resolve(node);
      })
      .catch(error => {
        reject(error);
      });
  });

  const info = qryResponse as IGithubInfo;

  return {
    packageVersion,
    lastCommittedUser: info.committer.name || info.author.name || 'N/A',
    lastCommittedDate: info.committer.date || info.author.date || 'N/A',
    lastCommitMessage: info.message || 'N/A',
    branch: 'develop',
    sha: info.oid,
    abbreviatedSha: info.abbreviatedOid,
  };
};

const configQueries = {
  /**
   * Config object
   */
  configsDetail(_root, { code }: { code: string }) {
    return Configs.findOne({ code });
  },

  async configsVersions(_root) {
    const erxesProjectPath = getEnv({ name: 'ERXES_PATH', defaultValue: `${process.cwd()}/../erxes` });
    const apiProjectPath = getEnv({ name: 'API_PATH', defaultValue: process.cwd() });
    const widgetProjectPath = getEnv({ name: 'WIDGET_PATH', defaultValue: `${process.cwd()}/../erxes-widgets` });
    const widgetApiProjectPath = getEnv({
      name: 'WIDGET_API_PATH',
      defaultValue: `${process.cwd()}/../erxes-widgets-api`,
    });

    if (!GITHUB_ACCESS_TOKEN) {
      throw new Error('Github access token not defined.');
    }

    if (!GITHUB_GRAPHQL_URL) {
      throw new Error('Github graphql endpoint not defined.');
    }

    const response = {
      erxesVersion: await getGitInfos('erxes', erxesProjectPath),
      apiVersion: await getGitInfos('erxes-api', apiProjectPath),
      widgetVersion: await getGitInfos('erxes-widgets', widgetProjectPath),
      widgetApiVersion: await getGitInfos('erxes-widgets-api', widgetApiProjectPath),
    };

    return response;
  },
};

moduleRequireLogin(configQueries);

export default configQueries;
