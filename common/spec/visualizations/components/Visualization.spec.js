import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import $ from 'jquery';

import Visualization from 'common/visualizations/components/Visualization';

import mockVif from '../mockVif';

describe('Visualization', () => {
  let element;

  const renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument);
  const getDefaultProps = () => ( { vif: mockVif } );

  beforeEach(() => {
    sinon.stub($.fn, 'socrataSvgHistogram', () => {});
  });

  afterEach(() => {
    $.fn.socrataSvgHistogram.restore();
  });


  it('renders an element', () => {
    element = renderComponent(Visualization, getDefaultProps());

    assert.isNotNull(ReactDOM.findDOMNode(element));
  });

  it('initializes a visualization', () => {
    element = renderComponent(Visualization, getDefaultProps());
    sinon.assert.calledOnce($.fn.socrataSvgHistogram);
    sinon.assert.calledWith($.fn.socrataSvgHistogram, mockVif);
  });

  describe('visualization event handling', () => {
    beforeEach(() => {
      element = renderComponent(Visualization, getDefaultProps());
    });

    it('triggers the visualization to update on component update', () => {
      const updateSpy = sinon.spy(element.visualization, 'update');
      element.componentDidUpdate();

      sinon.assert.called(updateSpy);
    });

    it('removes the visualization on unmount', () => {
      element.componentWillUnmount();
      const container = ReactDOM.findDOMNode(element).querySelector('.socrata-visualization-container');

      assert.isNull(container);
    });
  });
});
