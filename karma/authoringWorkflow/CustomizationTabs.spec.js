import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import { CustomizationTabs } from 'src/authoringWorkflow/CustomizationTabs';
import defaultVif from 'src/authoringWorkflow/defaultVif';

var renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

function defaultProps() {
  return {
    tabs: [
      {id: 'hello-world', title: 'Hello World', content: <div></div>},
      {id: 'hello-you', title: 'Hello You', content: <div></div>}
    ],
    currentTabSelection: 'hello-you',
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
        expect(component.querySelector('li')).to.have.attribute('role', 'presentation');
      });

      it('should add aria-controls that refers to the pane that the tab controls', function() {
        expect(component.querySelector('li a')).to.have.attribute('aria-controls', 'hello-world-panel');
      });

      describe('aria-selected', function() {
        describe('when selected', function() {
          it('should have aria-selected true', function() {
            var selectedTab = component.querySelector('.current a');
            expect(selectedTab).to.have.attribute('aria-selected', 'true');
          });
        });

        describe('when not selected', function() {
          it('should have aria-selected false', function() {
            var selectedTab = component.querySelector('li:not(.current) a');
            expect(selectedTab).to.have.attribute('aria-selected', 'false');
          });
        });
      });
    });
  });

  describe('events', function() {
    it('should invoke onTabNavigation when clicking on a new tab', function() {
      var listItem = component.querySelector('li');

      TestUtils.Simulate.click(listItem);
      sinon.assert.calledOnce(props.onTabNavigation);
    });

    it('should invoke onTabNavigation when focusing on a new tab', function() {
      var listItem = component.querySelector('li a');

      TestUtils.Simulate.focus(listItem);
      sinon.assert.calledOnce(props.onTabNavigation);
    });
  });

  describe('props', function() {
    it('should respond to a change to currentTabSelection', function() {
      var id = 'hello-world';

      var modifiedProps = defaultProps();
      modifiedProps.currentTabSelection = id;

      var component = renderComponent(CustomizationTabs, modifiedProps);
      var listItem = component.querySelector('li.current');

      expect(listItem.querySelector('a')).to.have.id(`${id}-link`);
    });
  });
});
