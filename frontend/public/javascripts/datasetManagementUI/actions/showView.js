import { socrataFetch, getJson, checkStatus } from 'lib/http';
import * as dsmapiLinks from 'dsmapiLinks';
import { editRevision } from 'actions/revisions';

export function loadRevisionsList() {
  return (dispatch) => {
    return socrataFetch(dsmapiLinks.revisionsForView)
      .then(checkStatus)
      .then(getJson)
      .then((resp) => {
        resp.forEach((revisionResource) => {
          const revision = revisionResource.resource;
          dispatch(editRevision(revision.id, revision));
        });
      })
      .catch((err) => {
        console.warn('failed to load revisions list', err);
      });
  };
}

export function createRevision() {
  // TODO: apiCallStarted stuff
  return (dispatch) => {
    return socrataFetch(dsmapiLinks.createRevision, {
      method: 'POST'
    })
      .then(checkStatus)
      .then(getJson)
      .then((resp) => {
        const revision = resp.resource;
        dispatch(editRevision(revision.id, revision));
        return revision;
      })
      .catch((err) => {
        console.warn('failed to create revision', err);
      });
  };
}
