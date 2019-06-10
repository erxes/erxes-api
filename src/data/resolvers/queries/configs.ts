import * as gitRepoInfo from 'git-repo-info';
import * as path from 'path';
import * as request from 'request';
import { Configs } from '../../../db/models';
import { moduleRequireLogin } from '../../permissions';
import { getEnv } from '../../utils';

interface IInfo {
  branch: string; // current branch
  sha: string; // current sha
  abbreviatedSha: string; // first 10 chars of the current sha
  tag: string; // tag for the current sha (or `null` if no tag exists)
  lastTag: string; // tag for the closest tagged ancestor
  //   (or `null` if no ancestor is tagged)
  commitsSinceLastTag: string; // number of commits since the closest tagged ancestor
  //   (`0` if this commit is tagged, or `Infinity` if no ancestor is tagged)
  committer: string; // committer for the current sha
  committerDate: string; // commit date for the current sha
  author: string; // author for the current sha
  authorDate: string; // authored date for the current sha
  commitMessage: string; // commit message for the current sha
}

const lastCommitQuery = `
  query { 
    repository(owner: "erxes", name: "erxes") { 
      object(expression: "develop") {
        ...on Commit {
          history(first: 1) {
            edges {
              node {
                message
                committedDate
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

const getGitInfos = async (projectPath: string) => {
  let packageVersion: string = 'N/A';

  try {
    packageVersion = require(path.join(projectPath, 'package.json')).version;
  } catch (e) {
    return;
  }

  request(
    'https://api.github.com/graphql',
    {
      headers: {
        Authorization: '5faefae2aac30df1bef9a2617cbe5a6526dda698',
        'User-Agent': 'erxes',
      },
      json: lastCommitQuery,
    },
    (e, res, body) => console.log(e, res, body),
  );

  const info: IInfo = gitRepoInfo(projectPath);

  return {
    packageVersion,
    lastCommittedUser: info.committer || info.author || 'N/A',
    lastCommittedDate: info.committerDate || info.authorDate || 'N/A',
    lastCommitMessage: info.commitMessage || 'N/A',
    branch: info.branch,
    sha: info.sha,
    abbreviatedSha: info.abbreviatedSha,
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

    const response = {
      erxesVersion: await getGitInfos(erxesProjectPath),
      apiVersion: await getGitInfos(apiProjectPath),
      widgetVersion: await getGitInfos(widgetProjectPath),
      widgetApiVersion: await getGitInfos(widgetApiProjectPath),
    };

    return response;
  },
};

moduleRequireLogin(configQueries);

export default configQueries;
