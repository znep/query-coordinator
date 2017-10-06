import React from 'react';
import { Route, Redirect, IndexRoute } from 'react-router';
import * as Links from 'links/links';
import Home from 'pages/Home/Home';
import ShowRevision from 'pages/ShowRevision/ShowRevision';
import ManageMetadata from 'pages/ManageMetadata/ManageMetadata';
import ShowOutputSchema from 'pages/ShowOutputSchema/ShowOutputSchema';
import ShowUpload from 'pages/ShowUpload/ShowUpload';
import NoMatch from 'pages/NoMatch/NoMatch';

const checkIfPublished = store => (nextState, replace, cb) => {
  const { fourfour } = nextState.params;
  const view = store.getState().entities.views[fourfour] || {};
  // assume unpublished if we don't have the info we need for some reason
  const displayType = view.displayType || 'draft';
  const isPublishedDataset = displayType !== 'draft';

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
