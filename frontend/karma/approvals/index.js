import 'script!jquery';
import { Provider } from 'react-redux';

window.mixpanelConfig = require('./data/mock_mixpanel_config').default;
window.sessionData = require('./data/mock_session_data').default;
window.serverConfig = require('./data/mock_server_config').default;
window.initialState = require('./data/mock_initial_state').default;

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
requireAll(require.context('.', true, /\.spec\.js$/));
