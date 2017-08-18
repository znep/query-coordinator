import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import 'babel-polyfill-safe';
import { createRolesAdmin } from './components/RolesAdmin';
import forEach from 'lodash/fp/forEach';
import getOr from 'lodash/fp/getOr';
import merge from 'lodash/fp/merge';

window.addEventListener('load', function() {
  forEach(mountPoint => {
    ReactDOM.render(
      createRolesAdmin(merge({ translations: getOr({}, 'translations', window.blist) }, window.serverConfig)),
      mountPoint
    );
  }, document.querySelectorAll('[data-react-component="RolesAdmin"]'));
});
