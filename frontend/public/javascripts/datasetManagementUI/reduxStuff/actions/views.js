import _ from 'lodash';
import { socrataFetch, getJson, checkStatus } from 'lib/http';
import * as sodaLinks from 'links/sodaLinks';
import * as coreLinks from 'links/coreLinks';

export const EDIT_VIEW = 'EDIT_VIEW';
export const editView = (id, payload) => ({
  type: EDIT_VIEW,
  id,
  payload
});

export function getRowCount(fourfour) {
  return dispatch =>
    socrataFetch(sodaLinks.rowCount(fourfour))
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        let rowCount;

        if (resp && resp[0] && resp[0].count) {
          rowCount = _.toNumber(resp[0].count);
        }

        rowCount = _.isNumber(rowCount) ? rowCount : 0;

        dispatch(editView(fourfour, { rowCount }));
      });
}

export function getView(fourfour) {
  return dispatch =>
    socrataFetch(coreLinks.view(fourfour))
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        dispatch(
          editView(fourfour, {
            columns: resp.columns,
            displayType: resp.displayType
          })
        );
      });
}
