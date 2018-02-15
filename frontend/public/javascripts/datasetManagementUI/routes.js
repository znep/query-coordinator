import React from 'react';
import _ from 'lodash';
import { Route, IndexRoute, IndexRedirect } from 'react-router';
import * as Links from 'datasetManagementUI/links/links';
import Home from 'datasetManagementUI/pages/Home/Home';
import ShowRevision from 'datasetManagementUI/pages/ShowRevision/ShowRevision';
import ManageMetadata from 'datasetManagementUI/containers/ManageMetadataContainer';
import DatasetForm from 'datasetManagementUI/components/DatasetForm/DatasetForm';
import ColumnForm from 'datasetManagementUI/components/ColumnForm/ColumnForm';
import ShowOutputSchema from 'datasetManagementUI/pages/ShowOutputSchema/ShowOutputSchema';
import TablePane from 'datasetManagementUI/pages/ShowOutputSchema/TablePane';
import ParseOptionsPane from 'datasetManagementUI/pages/ShowOutputSchema/ParseOptionsPane';
import GeocodeShortcutPane from 'datasetManagementUI/pages/ShowOutputSchema/GeocodeShortcutPane';
import TransformColumnPane from 'datasetManagementUI/pages/ShowOutputSchema/TransformColumnPane';
import AddColPane from 'datasetManagementUI/pages/ShowOutputSchema/AddColPane';
import ShowBlobPreview from 'datasetManagementUI/pages/ShowBlobPreview/ShowBlobPreview';
import ShowSource from 'datasetManagementUI/pages/ShowSource/ShowSource';
import { focusColumnEditor } from 'datasetManagementUI/reduxStuff/actions/manageMetadata';
import NoMatch from 'datasetManagementUI/pages/NoMatch/NoMatch';
import DragDropUpload from 'datasetManagementUI/components/DragDropUpload/DragDropUpload';
import URLSource from 'datasetManagementUI/containers/URLSourceContainer';
import HrefForm from 'datasetManagementUI/containers/HrefFormContainer';

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
  const editMode = view.displayType !== 'draft';

  if (editMode) {
    replace(Links.home(nextState.params));
    cb();
  } else {
    cb();
  }
};


export default function rootRoute(store) {
  // If we upgrade to react-router 4 we can have a non-insane route hierarchy for the showOutputSchema
  // page: https://github.com/ReactTraining/react-router/issues/4105#issuecomment-289195202
  return (
    <Route path="/(:locale/):category/:name/:fourfour/revisions/:revisionSeq" component={Home}>
      <IndexRoute component={ShowRevision} />
      <Route path="metadata" component={ManageMetadata}>
        <IndexRedirect to="dataset" />
        <Route path="dataset" component={DatasetForm} />
        <Route path=":outputSchemaId/columns" onEnter={checkSchemaStatus(store)} component={ColumnForm} />
      </Route>
      <Route path="sources" component={ShowSource} onEnter={checkIfPublished(store)}>
        <IndexRoute component={DragDropUpload} />
        <Route path="url" component={URLSource} />
        <Route path="href" component={HrefForm} />
      </Route>
      <Route
        path="sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId"
        component={ShowOutputSchema}>
        <IndexRoute component={TablePane} />
        <Route path="page/:pageNo" component={TablePane} />
        <Route path="parse_options" component={ParseOptionsPane} />

        <Route path="georeference" component={GeocodeShortcutPane}>
          <Route
            path="column_errors/:errorsTransformId"
            component={GeocodeShortcutPane}>
            <Route
              path="page/:pageNo"
              component={GeocodeShortcutPane} />
          </Route>
          <Route
            path="page/:pageNo"
            component={GeocodeShortcutPane} />
        </Route>

        <Route path="editor/:outputColumnId" component={TransformColumnPane}>
          <Route
            path="column_errors/:errorsTransformId"
            component={TransformColumnPane}>
            <Route
              path="page/:pageNo"
              component={TransformColumnPane} />
          </Route>
          <Route
            path="page/:pageNo"
            component={TransformColumnPane} />
        </Route>

        <Route path="add_col" component={AddColPane} />

        <Route path="column_errors(/:errorsTransformId)" component={TablePane}>
          <Route path="page/:pageNo" component={TablePane} />
        </Route>

        <Route path="row_errors" component={TablePane}>
          <Route path="page/:pageNo" component={TablePane} />
        </Route>
      </Route>
      <Route path="sources/:sourceId/preview" component={ShowBlobPreview} onEnter={checkIfPublished(store)} />
      <Route path="*" component={NoMatch} />
    </Route>
  );
}
