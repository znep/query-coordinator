import * as constants from '../constants';

import {
  createGenericDownload,
  cancelGenericDownload
} from './genericDownloadActions';

import {
  FETCH_CSV_EXPORT_STARTED,
  FETCH_CSV_EXPORT_CANCELED,
  FETCH_CSV_EXPORT_SUCCEEDED,
  FETCH_CSV_EXPORT_FAILED
} from '../actionTypes';

export function downloadCsvExportData() {
  return {
    type: FETCH_CSV_EXPORT_STARTED,
    ...createGenericDownload(
      'goals.csv',
      constants.exportCsvUrl,
      FETCH_CSV_EXPORT_SUCCEEDED,
      FETCH_CSV_EXPORT_FAILED
    )
  };
}

export function cancelCsvExportData() {
  return {
    type: FETCH_CSV_EXPORT_CANCELED,
    ...cancelGenericDownload(constants.exportCsvUrl)
  };
}
