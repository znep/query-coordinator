import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import 'src/SvgColumnChart';
import 'src/SvgTimelineChart';

import { Visualization } from 'src/authoringWorkflow/Visualization';
import defaultVif from 'src/authoringWorkflow/defaultVif';

var renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

function defaultProps() {
  return {
    datasetMetadata: {
      id: 'asdf-qwer'
    },
    vif: defaultVif
  }
};

function rendersChartType(type, jqueryFunctionName) {
  it(`calls $.fn.${type}`, function() {
    var spy = sinon.stub($.fn, jqueryFunctionName);
    var props = defaultProps();

    _.set(props.vif, 'series[0].type', type);

    var element = renderComponent(Visualization, props);

    expect(spy.called).to.be.true
  });
}

describe('Visualization', function() {
  it('renders an empty <div>', function() {
    var element = renderComponent(Visualization, defaultProps());

    expect(element.querySelector('.visualization-preview')).to.be.empty;
    expect(element).to.have.class('visualization-preview-container');
  });

  describe('with a valid vif', function() {
    describe('when rendering a columnChart', function() {
      rendersChartType('columnChart', 'socrataSvgColumnChart');
    });

    describe('when rendering a timelineChart', function() {
      rendersChartType('timelineChart', 'socrataSvgTimelineChart');
    });
  });
});
