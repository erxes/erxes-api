import { registerModule } from '../utils';
import { moduleObj as brandActions } from './brand';
import { moduleObj as permissionActions } from './permission';

registerModule(brandActions);
registerModule(permissionActions);
