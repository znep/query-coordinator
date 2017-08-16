import { socrataFetch, checkStatus, getJson } from '../lib/http';
import * as dsmapiLinks from '../dsmapiLinks';
import _ from 'lodash';
import { parseDate } from 'lib/parseDate';
import {
  listenForOutputSchemaSuccess,
  subscribeToOutputSchema,
  subscribeToTransforms,
  insertInputSchema,
  subscribeToRowErrors
} from 'actions/manageUploads';
import { showModal } from 'actions/modal';
import * as ApplyRevision from 'actions/applyRevision';
import { addNotification } from 'actions/notifications';
import { makeFieldsets, validateDatasetForm } from 'models/forms';
import { browserHistory } from 'react-router';
import * as Links from 'links';

export function loadRevision(params) {
  return (dispatch, getState) => {
    const { views } = getState().entities;

    return Promise.all([
      getCurrentRevision(params),
      getSources(params)
    ]).then(([revision, sources]) => {
      const initialTaskSets = makeTaskSets(revision);

      const view = views[revision.fourfour];

      const { customMetadataFieldsets } = view;

      const initialSources = sources.reduce(
        (acc, source) => ({
          ...acc,
          [source.id]: {
            ...source,
            created_at: parseDate(source.created_at),
            finished_at: source.finished_at ? parseDate(source.finished_at) : null,
            failed_at: source.failed_at ? parseDate(source.failed_at) : null,
            created_by: source.created_by
          }
        }),
        {}
      );

      const metadataErrors = getMetadataErrors(revision, customMetadataFieldsets);


      dispatch(loadRevisionSuccess(revision, initialTaskSets, initialSources, metadataErrors));

      dispatch(sideEffectyStuff(revision, initialSources, params));
    });
  };
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
        fourfour: resource.fourfour,
        metadata: resource.metadata,
        permission: _.get(resource, 'action.permission', 'public'),
        task_sets: resource.task_sets,
        revision_seq: _.toNumber(resource.revision_seq),
        created_at: parseDate(resource.created_at),
        created_by: resource.created_by,
        datasetMetadataErrors: []
      };
    });
}

function getSources(params) {
  return socrataFetch(dsmapiLinks.sourceIndex(params)).then(checkStatus).then(getJson).then(revisions => {
    return revisions.map(revision => revision.resource);
  });
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

function sideEffectyStuff(revision, sources, params) {
  return dispatch => {
    // partition failed and successful sources (ie uploads) since we only want
    // to insert into store and subscribe to row errors if it succeeded
    const [failed, succeeded] = _.partition(sources, source => source.failed_at);

    failed.forEach(source => dispatch(addNotification('source', null, source.id)));

    const inputSchemas = _.flatMap(succeeded, source =>
      source.schemas.map(schema => ({
        ...schema,
        source_id: source.id
      }))
    );

    const outputSchemas = _.flatMap(inputSchemas, is => is.output_schemas);

    inputSchemas.forEach(is => {
      dispatch(insertInputSchema(is, is.source_id));
      dispatch(subscribeToRowErrors(is));
    });

    outputSchemas.forEach(os => dispatch(listenForOutputSchemaSuccess(os)));

    // TODO: Once we swap out the view logic that uses client-supplied attributes
    // (contiguous_rows_processed, num_transform_errors) and make it use server-side
    // attributes (completed_at on the os), than add this line here: .filter(os => os.completed_at === null)
    outputSchemas.forEach(os => {
      dispatch(subscribeToOutputSchema(os));
      dispatch(subscribeToTransforms(os));
    });

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
  };
}

export const LOAD_REVISION_SUCCESS = 'LOAD_REVISION_SUCCESS';
function loadRevisionSuccess(revision, taskSets, sources, metadataErrors) {
  return {
    type: LOAD_REVISION_SUCCESS,
    revision,
    taskSets,
    sources,
    metadataErrors
  };
}

export function redirectToBaseIfTaskSetExists(params) {
  return (dispatch, getState) => {
    const entities = getState().entities;

    const taskSet = _.maxBy(_.values(entities.task_sets), job => job.updated_at);
    if (taskSet) {
      browserHistory.push(Links.revisionBase(params));
    }
  };
}
