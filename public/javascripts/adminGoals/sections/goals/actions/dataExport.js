import * as SharedActions from '../../shared/actions';
import * as Constants from '../constants';

export const downloadCsv = () => SharedActions.downloads.start('goals', Constants.goalsCsvFilename, Constants.goalsCsvUrl);
export const cancelDownloadCsv = () => SharedActions.downloads.cancel('goals', Constants.goalsCsvUrl);
