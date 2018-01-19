import _ from 'lodash';
import { createStore, compose } from 'redux';
import rootReducer from 'datasetManagementUI/reduxStuff/reducers/rootReducer';
import middleware from 'datasetManagementUI/reduxStuff/middleware';

export function getInitialState(view, customMetadataFieldsets) {
  const initialView = {
    id: view.id,
    name: view.name,
    columns: view.columns,
    displayType: view.displayType,
    rowCount: 0, // just initailizing here, will update later with soda api call
    description: view.description,
    category: view.category,
    owner: view.owner,
    viewLastModified: view.viewLastModified,
    rowsUpdatedAt: view.rowsUpdatedAt,
    createdAt: view.createdAt,
    viewCount: view.viewCount,
    downloadCount: view.downloadCount,
    license: view.license || {},
    licenseId: view.licenseId,
    attribution: view.attribution,
    attributionLink: view.attributionLink,
    tags: view.tags || [],
    privateMetadata: view.privateMetadata || {},
    attachments: _.get(view, 'metadata.attachments', []),
    metadata: view.metadata || {},
    customMetadataFieldsets
  };

  return {
    entities: {
      views: {
        [view.id]: initialView
      }
    }
  };
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const initialState = getInitialState(window.initialState.view, window.initialState.customMetadataFieldsets);

export default createStore(rootReducer, initialState, composeEnhancers(middleware));
