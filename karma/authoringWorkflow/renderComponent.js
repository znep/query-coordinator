import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import testStore from './testStore';

export default function(component, props) {
  var element = React.createElement(component, props);
  var providerInfusedElement = TestUtils.renderIntoDocument(
    <Provider store={testStore()}>
      {element}
    </Provider>
  );

  return ReactDOM.findDOMNode(providerInfusedElement);
}
