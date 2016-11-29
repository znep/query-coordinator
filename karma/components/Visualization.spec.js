import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import Visualization from 'src/components/Visualization';

import mockVif from '../mockVif';

describe('Visualization', () => {
  let element;

  const renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument);
  const getDefaultProps = () => ( { vif: mockVif } );

  it('renders an element', () => {
    element = renderComponent(Visualization, getDefaultProps());

    expect(ReactDOM.findDOMNode(element)).to.exist;
  });

  it('initializes a visualization', () => {
    element = renderComponent(Visualization, getDefaultProps());
    const container = ReactDOM.findDOMNode(element).querySelector('.socrata-visualization-container');

    expect(container).to.exist;
  });

  describe('visualization event handling', () => {
    beforeEach(() => {
      element = renderComponent(Visualization, getDefaultProps());
    });

    it('triggers the visualization to update on component update', () => {
      const updateSpy = sinon.spy(element.visualization, 'update');
      element.componentDidUpdate();

      expect(updateSpy.called).to.eq(true);
    });

    it('removes the visualization on unmount', () => {
      element.componentWillUnMount();
      const container = ReactDOM.findDOMNode(element).querySelector('.socrata-visualization-container');

      expect(container).to.not.exist;
    });
  });
});
