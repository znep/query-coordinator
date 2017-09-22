import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { Simulate } from 'react-dom/test-utils';
import { renderComponent  } from '../../helpers';
import SideMenu from 'components/SideMenu';

describe('SideMenu', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      title: 'Test Wombats',
      isAnchoredLeft: true,
      isOpen: true,
      onDismiss: _.noop,
      children: null
    });
  }

  it('renders', () => {
    const element = renderComponent(SideMenu, getProps());
    assert.isNotNull(element);
  });

  describe('title', () => {
    it('renders a title if provided', () => {
      const element = renderComponent(SideMenu, getProps());
      const title = element.querySelector('.menu-header-title');

      assert.isNotNull(title);
      assert.deepEqual(title.innerText, 'Test Wombats');
    });

    it('does not render a title if not provided', () => {
      const element = renderComponent(SideMenu, getProps({
        title: null
      }));
      assert.isNull(element.querySelector('.menu-header-title'));
    });
  });

  describe('isOpen', () => {
    describe('when true', () => {
      let element;

      beforeEach(() => {
        element = renderComponent(SideMenu, getProps());
      });

      it('adds the active class', () => {
        assert.isTrue(element.classList.contains('active'));
      });

      it('does not hide menu from screenreaders', () => {
        assert.deepEqual(element.getAttribute('aria-hidden'), null);
      });

      it('does not make the menu untabbable', () => {
        assert.deepEqual(element.getAttribute('tabindex'), null);
      });
    });

    describe('when false', () => {
      let element;

      beforeEach(() => {
        element = renderComponent(SideMenu, getProps({
          isOpen: false
        }));
      });

      it('does not add the active class', () => {
        assert.isFalse(element.classList.contains('active'));
      });

      it('hides the menu from screenreaders', () => {
        assert.deepEqual(element.getAttribute('aria-hidden'), 'true');
      });

      it('makes the menu untabbable', () => {
        assert.deepEqual(element.getAttribute('tabindex'), '-1');
      });
    });

    describe('when toggling after first render', () => {
      let node;

      beforeEach(() => {
        node = document.createElement('div');
      });

      afterEach(() => {
        node.remove();
      });

      it('hides the menu when isOpen is changed from true to false', () => {
        ReactDOM.render(React.createElement(SideMenu, getProps({ isOpen: true })), node);
        ReactDOM.render(React.createElement(SideMenu, getProps({ isOpen: false })), node);
        const element = node.querySelector('.side-menu');

        assert.isFalse(element.classList.contains('active'));
        assert.deepEqual(element.getAttribute('aria-hidden'), 'true');
        assert.deepEqual(element.getAttribute('tabindex'), '-1');
      });

      it('shows the menu when isOpen is changed from false to true', () => {
        ReactDOM.render(React.createElement(SideMenu, getProps({ isOpen: false })), node);
        ReactDOM.render(React.createElement(SideMenu, getProps({ isOpen: true })), node);
        const element = node.querySelector('.side-menu');

        assert.isTrue(element.classList.contains('active'));
        assert.deepEqual(element.getAttribute('aria-hidden'), null);
        assert.deepEqual(element.getAttribute('tabindex'), null);
      });
    });
  });

  describe('isAnchoredLeft', () => {
    it('adds the menu-anchor-left class if true', () => {
      const element = renderComponent(SideMenu, getProps());
      assert.isTrue(element.classList.contains('menu-anchor-left'));
      assert.isFalse(element.classList.contains('menu-anchor-right'));
    });

    it('adds the menu-anchor-right class if false', () => {
      const element = renderComponent(SideMenu, getProps({
        isAnchoredLeft: false
      }));
      assert.isTrue(element.classList.contains('menu-anchor-right'));
      assert.isFalse(element.classList.contains('menu-anchor-left'));
    });
  });

  describe('onDismiss', () => {
    it('renders a dismiss button', () => {
      const element = renderComponent(SideMenu, getProps());
      assert.isNotNull(element.querySelector('button.menu-header-dismiss'));
    });

    it('invokes the onDismiss handler on click on dismiss button', () => {
      const stub = sinon.stub();
      const element = renderComponent(SideMenu, getProps({
        onDismiss: stub
      }));
      Simulate.click(element.querySelector('button.menu-header-dismiss'));

      assert.isTrue(stub.calledOnce);
    });
  });

  it('renders children', () => {
    const element = renderComponent(SideMenu, getProps({
      children: <div className="test-child" />
    }));
    assert.isNotNull(element.querySelector('.test-child'));
  });
});
