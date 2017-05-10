import * as SharedActions from '../../shared/actions';
import * as Constants from '../constants';

export const downloadCsv = (csvUrl) => SharedActions.downloads.start('goals', Constants.goalsCsvFilename, csvUrl);
export const cancelDownloadCsv = () => SharedActions.downloads.cancel('goals', Constants.goalsCsvFilename);
