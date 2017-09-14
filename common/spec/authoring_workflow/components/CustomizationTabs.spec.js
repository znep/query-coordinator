import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import renderComponent from '../renderComponent';
import CustomizationTabs from 'common/authoring_workflow/components/CustomizationTabs';

function defaultProps() {
  return {
    tabs: [
      {id: 'hello-world', title: 'Hello World', paneComponent: 'span'},
      {id: 'hello-you', title: 'Hello You', paneComponent: 'span'}
    ],
    selection: 'hello-you',
    onTabNavigation: sinon.stub()
  }
};

describe('CustomizationTabs', function() {
  var component;
  var props;

  beforeEach(function() {
    props = defaultProps();
    component = renderComponent(CustomizationTabs, props);
  });

  describe('rendering', function() {
    it('should render a list', function() {
      expect(component).to.be.instanceof(HTMLElement);
      expect(component.tagName).to.equal('UL');
      expect(component).to.have.class('nav-tabs');
    });

    it('should render list items', function() {
      expect(component).to.have.length(2);
    });

    it('should select the second tab', function() {
      expect(component.querySelector('li:nth-child(2)')).to.have.class('current');
    });

    describe('aria', function() {
      it('should add a role', function() {
        expect(component.querySelector('li a')).to.have.attribute('role', 'tab');
      });

      it('should add aria-controls that refers to the pane that the tab controls', function() {
        expect(component.querySelector('li a')).to.have.attribute('aria-controls', 'hello-world-panel');
      });

      describe('aria-selected', function() {
        describe('when selected', function() {
          it('should have aria-selected true', function() {
            var selectedTabLink = component.querySelector('.current a');
            expect(selectedTabLink).to.have.attribute('aria-selected', 'true');
          });
        });

        describe('when not selected', function() {
          it('should have aria-selected false', function() {
            var selectedTabLink = component.querySelector('li:not(.current) a');
            expect(selectedTabLink).to.have.attribute('aria-selected', 'false');
          });
        });
      });
    });
  });

  describe('events', function() {
    it('should invoke onTabNavigation when clicking on a new tab', function() {
      var listItem = component.querySelector('li a');

      TestUtils.Simulate.click(listItem);
      sinon.assert.calledOnce(props.onTabNavigation);
    });
  });

  describe('props', function() {
    it('should respond to a change to selection', function() {
      var id = 'hello-world';

      var modifiedProps = defaultProps();
      modifiedProps.selection = id;

      var component = renderComponent(CustomizationTabs, modifiedProps);
      var listItem = component.querySelector('li.current');

      expect(listItem.querySelector('a')).to.have.id(`${id}-link`);
    });
  });
});
