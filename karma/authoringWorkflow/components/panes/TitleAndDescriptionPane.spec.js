import _ from 'lodash';
import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import { TitleAndDescriptionPane } from 'src/authoringWorkflow/components/panes/TitleAndDescriptionPane';

describe('TitleAndDescriptionPane', function() {
  var component;
  var props;

  describe('without a visualization type', function() {
    beforeEach(function() {
      props = defaultProps({
        vifAuthoring: { authoring: { selectedVisualizationType: null } },
        onChangeTitle: sinon.stub(),
        onChangeDescription: sinon.stub(),
        onChangeShowSourceDataLink: sinon.stub()
      });

      component = renderComponent(TitleAndDescriptionPane, props);
    });

    it('renders an empty pane info message', function() {
      expect(component.querySelector('.authoring-empty-pane')).to.exist;
    });
  });

  describe('with a visualization type', function() {
    beforeEach(function() {
      props = defaultProps({
        onChangeTitle: sinon.stub(),
        onChangeDescription: sinon.stub(),
        onChangeShowSourceDataLink: sinon.stub()
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

      it('renders a source data link checkbox', function() {
        expect(component.querySelector('input[type="checkbox"]')).to.exist;
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

      describe('when changing the visibility of source data link', function() {
        it('should emit an onChangeShowSourceDataLink event', function() {
          var checkbox = component.querySelector('input[type="checkbox"]');

          TestUtils.Simulate.change(checkbox);
          sinon.assert.calledOnce(props.onChangeShowSourceDataLink);
        });
      });
    });
  });
});
