import React from 'react';
import { Route, Redirect, IndexRoute } from 'react-router';
import App from './components/App';
import ShowUpdate from './components/ShowUpdate';
import ManageMetadata from './components/ManageMetadata';
import ManageUploads from './components/ManageUploads';
import ShowOutputSchema from './components/ShowOutputSchema';
import { loadColumnErrors, loadRowErrors } from './actions/showOutputSchema';
import { focusColumnEditor } from './actions/manageMetadata';
import ShowUpload from './components/ShowUpload';
import NoMatch from './components/NoMatch';

export default function rootRoute(store) {
  return (
    <Route path="/:category/:name/:fourfour/updates/:updateSeq" component={App}>
      <IndexRoute component={ShowUpdate} />
      <Redirect from="metadata" to="metadata/dataset" />
      <Route path="metadata/dataset" component={ManageMetadata} />
      <Route
        path="metadata/columns"
        component={ManageMetadata}
        onEnter={(nextState) => store.dispatch(focusColumnEditor(nextState))} />
      <Route path="uploads" component={ManageUploads} />
      <Route path=":sidebarSelection" component={ShowUpdate} />
      <Route path="uploads/:uploadId" component={ShowUpload} />
      <Route
        path="uploads/:uploadId/schemas/:inputSchemaId/output/:outputSchemaId"
        component={ShowOutputSchema} />
      <Route
        path={'uploads/:uploadId/schemas/:inputSchemaId/output/' +
                ':outputSchemaId/column_errors/:errorsTransformId'}
        component={ShowOutputSchema}
        onEnter={(nextState) => store.dispatch(loadColumnErrors(nextState))} />
      <Route
        path="uploads/:uploadId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors"
        component={ShowOutputSchema}
        onEnter={(nextState) => store.dispatch(loadRowErrors(_.toNumber(nextState.params.inputSchemaId), 0, 100))} />
      <Route path="*" component={NoMatch} />
    </Route>
  );
}
