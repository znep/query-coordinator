import React from 'react';
import $ from 'jquery';
import TestUtils from 'react-dom/test-utils';

import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { AuthoringWorkflow } from 'common/authoring_workflow/components/AuthoringWorkflow';
import vifs from 'common/authoring_workflow/vifs';

function render(type, backButtonText) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onChangeXAxisScalingMode: sinon.spy(),
    onComplete: sinon.spy(),
    onCancel: sinon.spy(),
    onBack: sinon.spy(),
    onReset: sinon.spy(),
    backButtonText: backButtonText
  });

  return {
    props: props,
    component: renderComponent(AuthoringWorkflow, props)
  };
}

describe('AuthoringWorkflow', function() {
  var component;
  var props;

  function setUpVisualization(type) {
    return function() {
      var renderedParts = render(type);

      component = renderedParts.component;
      props = renderedParts.props;
    };
  }

  function makeVisualizationValid(props) {
    _.set(props.vifAuthoring.vifs.columnChart, 'series[0].dataSource.domain', 'something');
    _.set(props.vifAuthoring.vifs.columnChart, 'series[0].dataSource.datasetUid', 'something');
    _.set(props.vifAuthoring.vifs.columnChart, 'series[0].dataSource.dimension.columnName', 'something');
    _.set(props, 'vifAuthoring.authoring.filters', [{
      parameters: {
        columnName: 'test'
      }
    }]);
    return props;
  }

  function emitsEvent(id, eventName) {
    it(`should emit an ${eventName} event`, function() {
      TestUtils.Simulate.change(component.querySelector(id));
      sinon.assert.calledOnce(props[eventName]);
    });
  }

  function rendersXAxisScalingModeAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a x-axis scaling dropdown', function() {
        expect(component.querySelector('#x-axis-scaling-mode')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the x-axis scaling mode', function() {
        emitsEvent('#x-axis-scaling-mode', 'onChangeXAxisScalingMode');
      });
    });
  }

  beforeEach(setUpVisualization());

  describe('rendering', function() {
    it('renders the done button', function() {
      expect(component).to.contain('button.done');
    });

    it('renders the cancel button', function() {
      expect(component).to.contain('button.cancel');
    });

    it('renders the modal close button', function() {
      expect(component).to.contain('.modal-header-dismiss');
    });

    describe('when configured with backButtonText', function() {
      beforeEach(function() {
        var renderedParts = render('columnChart', 'Back Button Text');

        component = renderedParts.component;
        props = renderedParts.props;
      });

      it('renders the back button', function() {
        expect(component).to.contain('.authoring-back-button');
      });
    });

    it('renders a reset button', () => {
      expect(component).to.contain('.authoring-reset-button');
    });

    describe('done button', () => {
      it('is disabled if a valid visualization is not selected', () => {
        var component = renderComponent(AuthoringWorkflow, props);
        expect(component.querySelector('button.done')).to.have.attribute('disabled');
      });

      it('is not disabled if a valid visualization is selected', () => {
        var validVifProps = makeVisualizationValid(props);
        var component = renderComponent(AuthoringWorkflow, validVifProps);
        expect(component.querySelector('button.done')).to.not.have.attribute('disabled');
      });

      it('is disabled if a valid visualization is selected but a user is interacting with a debounced component', () => {
        var validVifProps = makeVisualizationValid(props);
        validVifProps.vifAuthoring.authoring.userCurrentlyActive = true;
        var component = renderComponent(AuthoringWorkflow, validVifProps);
        expect(component.querySelector('button.done')).to.have.attribute('disabled');
      });
    });
  });

  describe('events', function() {
    it('handles "submit" event and returns false', function() {
      // This prevents the form from submitting and refreshing the page.
      var submitEvent = $.Event('submit');
      $(component).trigger(submitEvent);
      assert.strictEqual(submitEvent.result, false, 'Unexpected event handler result');
    });

    it('calls the onComplete callback when the done button is clicked', function() {
      var validVifProps = makeVisualizationValid(props);
      var component = renderComponent(AuthoringWorkflow, validVifProps);

      sinon.assert.notCalled(validVifProps.onComplete);
      TestUtils.Simulate.click(component.querySelector('button.done'));

      sinon.assert.calledOnce(validVifProps.onComplete);
      sinon.assert.calledWithExactly(validVifProps.onComplete, {
        vif: validVifProps.vif,
        filters: validVifProps.vifAuthoring.authoring.filters
      });
    });

    describe('when the cancel button is clicked', () => {
      beforeEach(() => {
        // Watch confirm to ensure that it is called to prompt user.
        sinon.stub(window, 'confirm').returns(true);
      });

      afterEach(() => {
        window.confirm.restore();
      });

      describe('when no changes have been made', () => {
        beforeEach(() => {
          _.set(props, 'vifAuthoring.vifs', {});
          _.set(props, 'vifAuthoring.authoring.checkpointVifs', {});
          component = renderComponent(AuthoringWorkflow, props);
        });

        it('immediately calls onCancel', () => {
          expect(props.onCancel.called).to.be.false;
          TestUtils.Simulate.click(component.querySelector('button.cancel'));
          expect(props.onCancel.calledOnce).to.be.true;
          expect(window.confirm.called).to.be.false;
        });
      });

      describe('when changes have been made', () => {
        beforeEach(() => {
          _.set(props, 'vifAuthoring.vifs', {notI: 'saidHe'});
          _.set(props, 'vifAuthoring.authoring.checkpointVifs', {notI: 'saidThey'});
          component = renderComponent(AuthoringWorkflow, props);
        });

        it('asks the user for confirmation before closing', () => {
          expect(props.onCancel.called).to.be.false;
          TestUtils.Simulate.click(component.querySelector('button.cancel'));
          expect(props.onCancel.calledOnce).to.be.true;
          expect(window.confirm.calledOnce).to.be.true;
        });
      });
    });

    describe('when the back button is clicked', () => {
      beforeEach(() => {
        // Watch confirm to ensure that it is called to prompt user.
        sinon.stub(window, 'confirm').returns(true);
        var renderedParts = render('columnChart', 'Back Button Text');
        component = renderedParts.component;
        props = renderedParts.props;
      });

      afterEach(() => {
        window.confirm.restore();
      });

      describe('when no changes have been made', () => {
        beforeEach(() => {
          _.set(props, 'vifAuthoring.vifs', {});
          _.set(props, 'vifAuthoring.authoring.checkpointVifs', {});
          var renderedParts = render('columnChart', 'Back Button Text');
          component = renderedParts.component;
          props = renderedParts.props;
        });

        it('calls the onBack callback immediately', function() {
          sinon.assert.notCalled(props.onBack);
          TestUtils.Simulate.click(component.querySelector('.authoring-back-button'));
          sinon.assert.calledOnce(props.onBack);
        });
      });

      describe('when changes have been made', () => {
        beforeEach(() => {
          _.set(props, 'vifAuthoring.vifs', {notI: 'saidHe'});
          _.set(props, 'vifAuthoring.authoring.checkpointVifs', {notI: 'saidThey'});
          component = renderComponent(AuthoringWorkflow, props);
        });

        it('asks the user for confirmation before closing', () => {
          expect(props.onBack.called).to.be.false;
          TestUtils.Simulate.click(component.querySelector('button.authoring-back-button'));
          sinon.assert.calledOnce(props.onBack);
          sinon.assert.calledOnce(window.confirm);
        });
      });
    });

    describe('when the reset button is clicked', () => {
      beforeEach(() => {
        // Watch confirm to ensure that it is called to prompt user.
        sinon.stub(window, 'confirm').returns(true);
      });

      afterEach(() => {
        window.confirm.restore();
      });

      it('asks the user for confirmation before reset', () => {
        expect(props.onReset.called).to.be.false;
        TestUtils.Simulate.click(component.querySelector('button.authoring-reset-button'));
        expect(props.onReset.calledOnce).to.be.true;
        expect(window.confirm.calledOnce).to.be.true;
      });

    });
  });

  xdescribe('columnChart', function() {
    beforeEach(setUpVisualization('timelineChart'));
    rendersXAxisScalingModeAndEmitsEvents();
  });

  xdescribe('timelineChart', function() {
    beforeEach(setUpVisualization('timelineChart'));
    rendersXAxisScalingModeAndEmitsEvents();
  });
});
