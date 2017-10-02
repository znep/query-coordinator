import React from 'react';
// import _ from 'lodash';
import { Route, Redirect, IndexRoute } from 'react-router';
import * as Links from 'links/links';
import Home from 'pages/Home/Home';
import ShowRevision from 'pages/ShowRevision/ShowRevision';
import ManageMetadata from 'pages/ManageMetadata/ManageMetadata';
import ShowOutputSchema from 'pages/ShowOutputSchema/ShowOutputSchema';
// import { focusColumnEditor } from 'reduxStuff/actions/manageMetadata';
import ShowUpload from 'pages/ShowUpload/ShowUpload';
import NoMatch from 'pages/NoMatch/NoMatch';

// const checkUploadStatus = store => (nextState, replace) => {
//   // TODO: is this valid? You can have a source with no output schema
//   const sourceExists = !_.isEmpty(store.getState().entities.output_columns);
//
//   if (sourceExists) {
//     store.dispatch(focusColumnEditor(nextState));
//   } else {
//     const newPath = Links.home(nextState.params);
//
//     replace(newPath);
//   }
// };

const checkIfPublished = store => (nextState, replace, cb) => {
  const { fourfour } = nextState.params;
  const view = store.getState().entities.views[fourfour] || {};
  const isPublishedDataset = view.displayType !== 'draft';

  if (isPublishedDataset) {
    replace(Links.home(nextState.params));
    cb();
  } else {
    cb();
  }
};

export default function rootRoute(store) {
  return (
    <Route path="/(:locale/):category/:name/:fourfour/revisions/:revisionSeq" component={Home}>
      <IndexRoute component={ShowRevision} />
      <Redirect from="metadata" to="metadata/dataset" />
      <Route path="metadata/dataset" component={ManageMetadata} />
      <Route path="metadata/:outputSchemaId/columns" component={ManageMetadata} />
      <Route path="sources" component={ShowUpload} onEnter={checkIfPublished(store)} />
      <Route path=":sidebarSelection" component={ShowRevision} />
      <Route
        path="sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId"
        component={ShowOutputSchema}
        onEnter={checkIfPublished(store)}>
        <Route path="page/:pageNo" component={ShowOutputSchema} />
      </Route>
      <Route
        path={
          'sources/:sourceId/schemas/:inputSchemaId/output/' +
          ':outputSchemaId/column_errors/:errorsTransformId'
        }
        component={ShowOutputSchema}
        onEnter={checkIfPublished(store)}>
        <Route path="page/:pageNo" component={ShowOutputSchema} />
      </Route>
      <Route
        path="sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors"
        component={ShowOutputSchema}
        onEnter={checkIfPublished(store)}>
        <Route path="page/:pageNo" component={ShowOutputSchema} />
      </Route>
      <Route path="*" component={NoMatch} />
    </Route>
  );
}
