import React from 'react';
import TestUtils from 'react-addons-test-utils';

import renderComponent from '../renderComponent';
import { ColorsAndStylePane } from 'src/authoringWorkflow/panes/ColorsAndStylePane';

function defaultProps() {
  return {
    onChangePrimaryColor: sinon.stub(),
    onChangeSecondaryColor: sinon.stub(),
    onChangeHighlightColor: sinon.stub()
  };
}

describe('ColorsAndStylePane', function() {
  var component;
  var props;

  beforeEach(function() {
    props = defaultProps();
    component = renderComponent(ColorsAndStylePane, props);
  });

  describe('rendering', function() {
    it('renders three inputs', function() {
      expect(component.querySelectorAll('input').length).to.equal(3);
      expect(component.querySelector('[name="primary-color"]')).to.exist;
      expect(component.querySelector('[name="secondary-color"]')).to.exist;
      expect(component.querySelector('[name="highlight-color"]')).to.exist;
    });
  });

  describe('events', function() {
    describe('when changing the primary color', function() {
      it('should emit an onChangePrimaryColor event', function() {
        var input = component.querySelector('[name="primary-color"]');

        TestUtils.Simulate.change(input);
        sinon.assert.calledOnce(props.onChangePrimaryColor);
      });
    });

    describe('when changing the secondary color', function() {
      it('should emit an onChangeSecondaryColor event', function() {
        var input = component.querySelector('[name="secondary-color"]');

        TestUtils.Simulate.change(input);
        sinon.assert.calledOnce(props.onChangeSecondaryColor);
      });
    });

    describe('when changing the highlight color', function() {
      it('should emit an onChangeHighlightColor event', function() {
        var input = component.querySelector('[name="highlight-color"]');

        TestUtils.Simulate.change(input);
        sinon.assert.calledOnce(props.onChangeHighlightColor);
      });
    });
  });
});
