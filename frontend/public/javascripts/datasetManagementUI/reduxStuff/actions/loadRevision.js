import _ from 'lodash';
import * as dsmapiLinks from 'links/dsmapiLinks';
import { showModal } from 'reduxStuff/actions/modal';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';
import { addNotification } from 'reduxStuff/actions/notifications';
import { createSourceSuccess } from 'reduxStuff/actions/createSource';
import { subscribeToOutputSchemaThings } from 'reduxStuff/actions/subscriptions';
import { makeFieldsets, validateDatasetForm } from 'models/forms';
import { normalizeCreateSourceResponse } from 'lib/jsonDecoders';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import { parseDate } from 'lib/parseDate';

export const LOAD_REVISION_SUCCESS = 'LOAD_REVISION_SUCCESS';

export function loadRevision(params) {
  return (dispatch, getState) => {
    const { views } = getState().entities;

    return Promise.all([getCurrentRevision(params), getSources(params)]).then(([revision, srcs]) => {
      // calc md errors
      const view = views[revision.fourfour];
      const { customMetadataFieldsets } = view;
      const metadataErrors = getMetadataErrors(revision, customMetadataFieldsets);

      // make taskSets to instert into store
      const taskSets = makeTaskSets(revision);

      // show toast for any faild notifications
      const [failed, succeeded] = _.partition(srcs, source => source.failed_at);
      failed.forEach(source => dispatch(addNotification('source', null, source.id)));

      // subscribe to sockets for input / output schemas
      _.flatMap(succeeded, source =>
        source.schemas.map(schema => ({
          ...schema,
          source_id: source.id
        }))
      ).forEach(subscribeToOutputSchemaThings);

      // insert new transforms, input schemas, etc into store; we parse this
      // stuff using the same code that we use when we create a new source
      succeeded.forEach(src => {
        const payload = normalizeCreateSourceResponse(src);
        dispatch(createSourceSuccess(payload));
      });

      // insert other stuff into store
      dispatch(loadRevisionSuccess(revision, taskSets, metadataErrors));

      // poll
      revision.task_sets.forEach(taskSet => {
        if (
          taskSet.status !== ApplyRevision.TASK_SET_SUCCESS &&
          taskSet.status !== ApplyRevision.TASK_SET_FAILURE
        ) {
          dispatch(ApplyRevision.pollForTaskSetProgress(taskSet.id, params));
        }
      });

      if (revision.task_sets.length) {
        dispatch(showModal('Publishing'));
      }
    });
  };
}

function loadRevisionSuccess(revision, taskSets, metadataErrors) {
  return {
    type: LOAD_REVISION_SUCCESS,
    revision,
    taskSets,
    metadataErrors
  };
}

function makeTaskSets(revision) {
  return revision.task_sets.reduce(
    (acc, taskSet) => ({
      ...acc,
      [taskSet.id]: {
        ...taskSet,
        created_at: parseDate(taskSet.created_at),
        finished_at: taskSet.finished_at ? parseDate(taskSet.finished_at) : null,
        created_by: taskSet.created_by
      }
    }),
    {}
  );
}

function getMetadataErrors(revision, customFieldests) {
  const { regular, custom } = makeFieldsets(revision, customFieldests);

  return validateDatasetForm(regular, custom).matchWith({
    Success: () => [],
    Failure: ({ value }) => value
  });
}

function getCurrentRevision(params) {
  return socrataFetch(dsmapiLinks.revisionBase(params))
    .then(checkStatus)
    .then(getJson)
    .then(({ resource }) => {
      return {
        id: resource.id,
        action: resource.action,
        fourfour: resource.fourfour,
        metadata: resource.metadata,
        output_schema_id: resource.output_schema_id,
        permission: _.get(resource, 'action.permission', 'public'),
        task_sets: resource.task_sets,
        revision_seq: _.toNumber(resource.revision_seq),
        created_at: parseDate(resource.created_at),
        created_by: resource.created_by
      };
    });
}

function getSources(params) {
  return socrataFetch(dsmapiLinks.sourceIndex(params))
    .then(checkStatus)
    .then(getJson)
    .then(revisions => {
      return revisions.map(revision => revision.resource);
    });
}
