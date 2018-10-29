import * as fs from 'fs';
import './cronJobs';
import { trackEngages } from './trackers/engageTracker';
import { trackIntegrations as trackFacebooks } from './trackers/facebookTracker';
import { trackIntegrations as trackTwitters } from './trackers/twitterTracker';
import { trackGmail } from './trackers/gmail';

export const init = async app => {
  const makeDirs = () => {
    const dir = `${__dirname}/private/xlsTemplateOutputs`;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  };

  trackTwitters();
  trackEngages(app);
  trackFacebooks(app);
  trackGmail();

  makeDirs();
};
