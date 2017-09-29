import _ from 'lodash';
import { socrataFetch, getJson, checkStatus } from 'lib/http';
import * as dsmapiLinks from 'dsmapiLinks';
import * as sodaLinks from 'sodaLinks';
import { editView } from 'reduxStuff/actions/views';
import { editRevision } from 'reduxStuff/actions/revisions';
import { parseDate } from 'lib/parseDate';
import { addNotification } from 'reduxStuff/actions/notifications';

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

// export const CREATE_SOURCE_SUCCESS = 'CREATE_SOURCE_SUCCESS';
//
// export function createSource(params) {
//   return dispatch => {
//     return socrataFetch(dsmapiLinks.sourceCreate(params), {
//       method: 'POST',
//       body: JSON.stringify({
//         source_type: { type: 'view' }
//       })
//     })
//       .then(checkStatus)
//       .then(getJson)
//       .then(resp => {
//         const { resource } = resp;
//
//         const source = {
//           ..._.omit(resource, 'schemas'),
//           created_at: parseDate(resource.created_at),
//           finished_at: resource.finished_at ? parseDate(resource.finished_at) : null,
//           failed_at: resource.failed_at ? parseDate(resource.failed_at) : null,
//           created_by: resource.created_by
//         };
//
//         if (source.failed_at) {
//           dispatch(addNotification('source', null, source.id));
//         }
//
//         console.log('ns', source);
//
//         const inputSchemas = resource.schemas
//           .map(schema => ({
//             id: schema.id,
//             name: schema.name,
//             total_rows: schema.total_rows,
//             source_id: source.id,
//             num_row_errors: 0
//           }))
//           .reduce(
//             (acc, a) => ({
//               [a.id]: a,
//               ...acc
//             }),
//             {}
//           );
//
//         const inputColumns = _.flatMap(resource.schemas, is => is.input_columns).reduce(
//           (acc, ic) => ({
//             [ic.id]: ic,
//             ...acc
//           }),
//           {}
//         );
//
//         // TODO: ok to grab created_by from the source? the one on the output schema
//         // always seems to be null
//         const outputSchemas = _.flatMap(resource.schemas, is => is.input_columns).reduce(
//           (acc, os) => ({
//             [os.id]: {
//               ...os,
//               created_by: resource.created_by
//             }
//           }),
//           {}
//         );
//
//         const outputColumns = _.chain(resource.schemas)
//           .flatMap(is => is.output_schemas)
//           .flatMap(os => os.output_columns)
//           .reduce(
//             (acc, oc) => ({
//               [oc.id]: {
//                 ...oc,
//                 transform: oc.transform.id
//               },
//               ...acc
//             }),
//             {}
//           )
//           .value();
//
//         const osoc = _.chain(resource.schemas)
//           .flatMap(is => is.output_schemas)
//           .flatMap(os =>
//             os.output_columns.map(oc => ({
//               ...oc,
//               os_id: os.id
//             }))
//           )
//           .reduce(
//             (acc, oc) => ({
//               [`${oc.os_id}-${oc.id}`]: {
//                 id: `${oc.os_id}-${oc.id}`,
//                 output_schema_id: oc.os_id,
//                 output_column_id: oc.id,
//                 is_primary_key: oc.is_primary_key
//               },
//               ...acc
//             }),
//             {}
//           )
//           .value();
//
//         const transforms = _.chain(resource.schemas)
//           .flatMap(is => is.output_schemas)
//           .flatMap(os => os.output_columns)
//           .map(oc => oc.transform)
//           .reduce(
//             (acc, transform) => ({
//               [transform.id]: transform,
//               ...acc
//             }),
//             {}
//           )
//           .value();
//
//         // console.log('is', inputSchemas);
//         // console.log('ic', inputColumns);
//         // console.log('os', outputSchemas);
//         // console.log('oc', outputColumns);
//         // console.log('os_oc', osoc);
//         // console.log('tr', transforms);
//
//         dispatch(
//           createSourceSuccess(
//             source,
//             inputSchemas,
//             inputColumns,
//             outputSchemas,
//             outputColumns,
//             osoc,
//             transforms
//           )
//         );
//
//         // console.log('resp', resp);
//         // shape source
//         // update source in store
//         // shape is
//         // shape os
//         // put is and os in store
//         // side effecty stuff
//       });
//   };
// }

// function createSourceSuccess(source, iss, ics, oss, ocs, osoc, ts) {
//   return {
//     type: CREATE_SOURCE_SUCCESS,
//     source: { [source.id]: source },
//     inputSchemas: iss,
//     inputColumns: ics,
//     outputSchemas: oss,
//     outputColumns: ocs,
//     outputSchemaColumns: osoc,
//     transforms: ts
//   };
// }

// function newSideEffectyStuff() {}
