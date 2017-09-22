import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

import renderComponent from '../renderComponent';
import { CustomizationTabPanes } from 'common/authoring_workflow/components/CustomizationTabPanes';

var hiddenClass = 'customization-tab-pane_hidden';
var showingSelector = `div:not(.${hiddenClass})`;

function defaultProps() {
  return {
    tabs: [
      {id: 'hello-world', title: 'Hello World', paneComponent: 'span'},
      {id: 'hello-you', title: 'Hello You', paneComponent: 'span'}
    ],
    selection: 'hello-you'
  }
};

describe('CustomizationTabPanes', function() {
  var component;

  describe('rendering', function() {
    beforeEach(function() {
      component = renderComponent(CustomizationTabPanes, defaultProps());
    });

    it('should render two panes', function() {
      expect(component).to.have.length(2);
    });

    it('should hide the first pane', function() {
      var hiddenPane = component.querySelector('div:first-child');
      expect(hiddenPane).to.have.class(hiddenClass);
    });

    it('should show the second pane', function() {
      var showingPane = component.querySelector(showingSelector);

      expect(showingPane).to.exist;
      expect(showingPane).to.have.id('hello-you-panel');
      expect(showingPane).to.not.have.class(hiddenClass);
    });

    describe('aria', function() {
      it('should add a role', function() {
        var pane = component.querySelector('div');
        expect(pane).to.have.attribute('role', 'tabpanel');
      });

      it('should add aria linking back to the panes tab sibling', function() {
        var pane = component.querySelector('div');
        expect(pane).to.have.attribute('aria-labelledby', 'hello-world-link');
      });

      describe('aria-hidden', function() {
        describe('when hidden', function() {
          it('should add aria-hidden false', function() {
            var showingPane = component.querySelector(showingSelector);
            expect(showingPane).to.have.attribute('aria-hidden', 'false');
          });
        });

        describe('when showing', function() {
          it('should add aria-hidden true', function() {
            var showingPane = component.querySelector(`.${hiddenClass}`);
            expect(showingPane).to.have.attribute('aria-hidden', 'true');
          });
        });
      });
    });
  });

  describe('props', function() {
    it('should select the selection', function() {
      var props = defaultProps();
      props.selection = 'hello-world';

      var component = renderComponent(CustomizationTabPanes, props);
      var showingPane = component.querySelector(showingSelector);

      expect(showingPane).to.have.id('hello-world-panel');
    });
  });
});
