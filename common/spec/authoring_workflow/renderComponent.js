import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import testStore from './testStore';

export default function(component, props, stateOverride) {
  const element = React.createElement(component, props);
  const providerInfusedElement = TestUtils.renderIntoDocument(
    <Provider store={testStore(stateOverride)}>
      {element}
    </Provider>
  );

  return ReactDOM.findDOMNode(providerInfusedElement);
}
