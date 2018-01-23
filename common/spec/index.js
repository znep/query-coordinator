import 'whatwg-fetch';
import 'babel-polyfill';
import 'common/visualizations/views/styles/socrata-visualizations.scss';

import { disableInputDebounce } from 'common/authoring_workflow/constants';

// Since we use jQuery plugins that patch themselves globally onto window.jQuery,
// we're forced to generate a single large test bundle (instead of karma-webpack's
// default of generating one package per test file).
// This file is responsible for defining that mega-package:
// pulling in every test file via requireAll.
window.$ = window.jQuery = require('jquery');

// The contents of this object is expected to be provided by the components under test.
window.serverConfig = {};

window.mixpanelConfig = require('./data/mock_mixpanel_config').default;
window.sessionData = require('./data/mock_session_data').default;
window.serverConfig = require('./data/mock_server_config').default;
const initialState = require('./data/mock_initial_state').default;
window.socrata = { initialState };

// Load the translations before each test.
beforeEach(require('./helpers').useDefaultTranslations);

// Disable some slow animations (saves around 50% test time).
disableInputDebounce();

function requireAll(context) {
  return context.keys().map(context);
}

requireAll(require.context('.', true, /spec\.js$/));
