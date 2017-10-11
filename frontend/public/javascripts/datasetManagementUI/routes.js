import React from 'react';
import _ from 'lodash';
import { Route, Redirect, IndexRoute } from 'react-router';
import * as Links from 'links/links';
import Home from 'pages/Home/Home';
import ShowRevision from 'pages/ShowRevision/ShowRevision';
import ManageMetadata from 'pages/ManageMetadata/ManageMetadata';
import ShowOutputSchema from 'pages/ShowOutputSchema/ShowOutputSchema';
import ShowSource from 'pages/ShowSource/ShowSource';
import { focusColumnEditor } from 'reduxStuff/actions/manageMetadata';
import NoMatch from 'pages/NoMatch/NoMatch';
import DragDropUpload from 'components/DragDropUpload/DragDropUpload';
import URLSource from 'components/URLSource/URLSource';

const checkSchemaStatus = store => (nextState, replace, cb) => {
  const osid = _.toNumber(nextState.params.outputSchemaId);
  // Edit Col metadata only works if we have an output schema, so check that
  // one exists before allowing access to the page
  const osExists = !_.isEmpty(store.getState().entities.output_schemas[osid]);

  if (osExists) {
    store.dispatch(focusColumnEditor(nextState));
    cb();
  } else {
    const newPath = Links.home(nextState.params);
    replace(newPath);
    cb();
  }
};

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
      <Route
        path="metadata/:outputSchemaId/columns"
        component={ManageMetadata}
        onEnter={checkSchemaStatus(store)} />
      <Route path="sources" component={ShowSource} onEnter={checkIfPublished(store)}>
        <IndexRoute component={DragDropUpload} />
        <Route path="url" component={URLSource} />
      </Route>
      <Route
        path="sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId"
        component={ShowOutputSchema}
        onEnter={checkIfPublished(store)}>
        <Route path="option/:option" component={ShowOutputSchema} />
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
