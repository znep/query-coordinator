import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { TitleAndDescriptionPane } from 'src/authoringWorkflow/panes/TitleAndDescriptionPane';

describe('TitleAndDescriptionPane', function() {
  var component;
  var props;

  beforeEach(function() {
    props = defaultProps({
      onChangeTitle: sinon.stub(),
      onChangeDescription: sinon.stub()
    });
    component = renderComponent(TitleAndDescriptionPane, props);
  });

  describe('rendering', function() {
    it('renders a title text input', function() {
      expect(component.querySelector('input[type="text"]')).to.exist;
    });

    it('renders a description text area', function() {
      expect(component.querySelector('textarea')).to.exist;
    });
  });

  describe('events', function() {
    describe('when changing the title', function() {
      it('should emit an onChangeTitle event', function() {
        var input = component.querySelector('input[type="text"]');

        TestUtils.Simulate.change(input);
        sinon.assert.calledOnce(props.onChangeTitle);
      });
    });

    describe('when changing the description', function() {
      it('should emit an onChangeDescription event', function() {
        var textarea = component.querySelector('textarea');

        TestUtils.Simulate.change(textarea);
        sinon.assert.calledOnce(props.onChangeDescription);
      });
    });
  });
});
