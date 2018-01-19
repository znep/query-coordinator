import 'babel-polyfill-safe';
// ^^ needed by common/components.
import { Provider } from 'react-redux';
import _ from 'lodash';
import React from 'react';
import TestUtils from 'react-dom/test-utils';
import ReactDOM from 'react-dom';
import windowState from './data/windowState';

window.$ = window.jQuery = require('jquery');
window._ = require('lodash');
window.I18n = require('mockTranslations');
window.serverConfig = {
  csrfToken: 'abcdefgh1234',
  appToken: 'global-frontend-token',
  currentUser: {
    "id": "asdf-1234",
    "createdAt": 1488413059,
    "displayName": "Test Dude",
    "email": "test.dude@socrata.com",
    "emailUnsubscribed": false,
    "firstName": "Test",
    "lastAuthenticatedAt": 1509124509,
    "lastLogin": 1509124509,
    "lastName": "Dude",
    "oid": 2,
    "profileLastModified": 1509124509,
    "publicTables": 0,
    "publicViews": 0,
    "roleId": 7,
    "roleName": "viewer",
    "screenName": "Test Dude",
    "rights": [
      "feature_items",
      "manage_spatial_lens",
      "manage_users",
      "view_all_dataset_status_logs",
      "create_data_lens",
      "chown_datasets",
      "create_datasets",
      "edit_others_datasets",
      "manage_provenance",
      "view_others_datasets",
      "can_see_all_assets_tab_siam",
      "configure_approvals",
      "review_approvals",
      "create_pages",
      "edit_pages",
      "create_dashboards",
      "edit_dashboards",
      "edit_goals",
      "manage_goals",
      "view_dashboards",
      "view_goals",
      "create_story",
      "create_story_copy",
      "delete_story",
      "edit_others_stories",
      "edit_story",
      "edit_story_title_desc",
      "manage_stories",
      "manage_story_collaborators",
      "manage_story_public_version",
      "manage_story_visibility",
      "view_story",
      "view_stories_stats",
      "view_unpublished_story",
      "edit_sdp",
      "edit_site_theme",
      "federations",
      "use_data_connectors",
      "approve_nominations",
      "edit_nominations",
      "moderate_comments",
      "manage_approval",
      "change_configurations",
      "view_domain"
    ],
    "flags": [
      "admin"
    ]
  },
  localePrefix: 'en',
  featureFlags: {
    usaid_features_enabled: false
  },
  usersnapProjectID: '7'
};




window.initialState = windowState;

window.renderPureComponent = _.flow(
  TestUtils.renderIntoDocument,
  ReactDOM.findDOMNode
);

window.renderComponent = _.flow(
  React.createElement,
  TestUtils.renderIntoDocument,
  ReactDOM.findDOMNode
);

window.renderComponentWithStore = function(component, props, store) {
  return window.renderComponent(
    Provider,
    { store },
    React.createElement(component, props)
  );
};

function requireAll(context) {
  context.keys().forEach(context);
}

requireAll(require.context('.', true, /Test\.js$/));
