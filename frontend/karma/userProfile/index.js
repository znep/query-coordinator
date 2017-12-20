import 'script!jquery';

window.serverConfig = require('./data/mock_server_config').default;
window.socrata = require('./data/mock_initial_state').default;
window.sessionData = require('./data/mock_mixpanel_config').default;
window.mixpanelConfig = require('./data/mock_session_data').default;

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
requireAll(require.context('.', true, /\.spec\.js$/));
