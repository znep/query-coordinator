import 'script!jquery';
import { Provider } from 'react-redux';

window.mixpanelConfig = require('./data/mock_mixpanel_config').default;
window.sessionData = require('./data/mock_session_data').default;
window.serverConfig = require('./data/mock_server_config').default;
window.socrata = {
  assetBrowser: { staticData: require('./data/mock_initial_state').default },
  currentUser: require('./data/mock_current_user').default
};

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
requireAll(require.context('.', true, /\.spec\.js$/));
