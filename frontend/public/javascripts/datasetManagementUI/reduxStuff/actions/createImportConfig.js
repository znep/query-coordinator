import uuid from 'uuid';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import {
  apiCallStarted,
  apiCallSucceeded,
  apiCallFailed,
  CREATE_IMPORT_CONFIG
} from 'reduxStuff/actions/apiCalls';
import * as dsmapiLinks from 'links/dsmapiLinks';
import moment from 'moment';

function nameForConfig(source) {
  if (source.source_type.type === 'upload') {
    const filename = source.source_type.filename.split('.')[0];
    const date = moment().format('MM-DD-YYYY');
    const uniq = uuid().slice(0, 4);
    return `${filename}_${date}_${uniq}`;
  }
  return uuid();
}

export function createImportConfig(source, outputSchemaId) {
  return (dispatch) => {
    const callId = uuid();
    const importConfigId = nameForConfig(source);
    dispatch(apiCallStarted(callId, {
      operation: CREATE_IMPORT_CONFIG,
      params: { outputSchemaId }
    }));

    return socrataFetch(dsmapiLinks.createImportConfig(outputSchemaId), {
      method: 'POST',
      body: JSON.stringify({
        name: importConfigId,
        data_action: 'replace'
      })
    }).
      then(checkStatus).
      then(getJson).
      then(({ resource }) => {
        dispatch(apiCallSucceeded(callId));
        return resource;
      }).
      catch((err) => {
        dispatch(apiCallFailed(callId, err));
      });
  };
}
