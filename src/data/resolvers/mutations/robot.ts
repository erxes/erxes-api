import { OnboardingHistories } from '../../../db/models/Robot';
import { IContext } from '../../types';

const robotMutations = {
  onboardingForceComplete(_root, _args, { user }: IContext) {
    return OnboardingHistories.forceComplete(user._id);
  },
};

export default robotMutations;
