import _ from 'lodash';
import { socrataFetch, getJson, checkStatus } from 'lib/http';
import * as dsmapiLinks from 'dsmapiLinks';
import * as sodaLinks from 'sodaLinks';
import { editView } from 'reduxStuff/actions/views';
import { editRevision } from 'reduxStuff/actions/revisions';

export function loadRevisionsList() {
  return dispatch => {
    return socrataFetch(dsmapiLinks.revisionsForView)
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        resp.forEach(revisionResource => {
          const revision = revisionResource.resource;
          dispatch(editRevision(revision.id, revision));
        });
      })
      .catch(err => {
        console.warn('failed to load revisions list', err);
      });
  };
}

export function createRevision() {
  // TODO: apiCallStarted stuff
  return dispatch => {
    return socrataFetch(dsmapiLinks.createRevision, {
      method: 'POST'
    })
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        const revision = resp.resource;
        dispatch(editRevision(revision.id, revision));
        return revision;
      })
      .catch(err => {
        console.warn('failed to create revision', err);
      });
  };
}

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

export function createSource(params) {
  return () => {
    return socrataFetch(dsmapiLinks.sourceCreate(params), {
      method: 'POST',
      body: JSON.stringify({
        source_type: { type: 'view' }
      })
    })
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        console.log('resp', resp);
      });
  };
}
