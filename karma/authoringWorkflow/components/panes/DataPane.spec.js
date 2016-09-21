import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import vifs from 'src/authoringWorkflow/vifs';
import { DataPane } from 'src/authoringWorkflow/components/panes/DataPane';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onSelectLimitNone: sinon.spy(),
    onSelectLimitCount: sinon.spy(),
    onChangeLimitCount: sinon.spy(),
    onChangeShowOtherCategory: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(DataPane, props)
  };
}

describe('DataPane', function() {
  var component;
  var props;

  function setUpVisualization(type) {
    return function() {
      var renderedParts = render(type);

      component = renderedParts.component;
      props = renderedParts.props;
    };
  }

  function emitsEvent(id, eventName, eventType) {
    it(`should emit an ${eventName} event`, function() {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(id));
      sinon.assert.calledOnce(props[eventName]);
    });
  }

  describe('rendering', function() {
    describe('with an error', function() {
      it('renders a metadata error message', function() {
        var component = renderComponent(DataPane, defaultProps({
          metadata: { error: true }
        }));

        expect(component.querySelector('.metadata-error')).to.exist;
      });
    });

    describe('while loading', function() {
      it('renders a loading spinner', function() {
        var component = renderComponent(DataPane, defaultProps({
          metadata: { isLoading: true }
        }));

        expect(component.querySelector('.metadata-loading')).to.exist;
      });
    });

    describe('limit and other category', function() {
      describe('when the current visualization type is "barChart"', function() {

        beforeEach(setUpVisualization('barChart'));

        it('renders a limit none radio button', function() {
          expect(component.querySelector('#limit-none')).to.exist;
        });

        it('renders a limit count radio button', function() {
          expect(component.querySelector('#limit-count')).to.exist;
        });

        it('renders a limit count number input field', function() {
          expect(component.querySelector('#limit-count-value')).to.exist;
        });

        it('renders a show other category checkbox', function() {
          expect(component.querySelector('#show-other-category')).to.exist;
        });

        emitsEvent('#limit-none', 'onSelectLimitNone');
        emitsEvent('#limit-count', 'onSelectLimitCount');
        emitsEvent('#limit-count-value', 'onChangeLimitCount');
        emitsEvent('#show-other-category', 'onChangeShowOtherCategory');
      });

      describe('when the current visualization type is not "barChart"', function() {

        beforeEach(setUpVisualization(''));

        it('renders a limit none radio button', function() {
          expect(component.querySelector('#limit-none')).to.not.exist;
        });

        it('renders a limit count radio button', function() {
          expect(component.querySelector('#limit-count')).to.not.exist;
        });

        it('renders a limit count number input field', function() {
          expect(component.querySelector('#limit-count-value')).to.not.exist;
        });

        it('renders a show other category checkbox', function() {
          expect(component.querySelector('#show-other-category')).to.not.exist;
        });
      });
    });
  });
});
