import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent  } from '../../helpers';
import SideMenu from 'components/SideMenu';
import { ESCAPE } from 'common/keycodes';

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
    expect(element).to.exist;
  });

  describe('title', () => {
    it('renders a title if provided', () => {
      const element = renderComponent(SideMenu, getProps());
      const title = element.querySelector('.menu-header-title');

      expect(title).to.exist;
      expect(title.innerText).to.eq('Test Wombats');
    });

    it('does not render a title if not provided', () => {
      const element = renderComponent(SideMenu, getProps({
        title: null
      }));
      expect(element.querySelector('.menu-header-title')).to.not.exist;
    });
  });

  describe('isOpen', () => {
    describe('when true', () => {
      let element;

      beforeEach(() => {
        element = renderComponent(SideMenu, getProps());
      });

      it('adds the active class', () => {
        expect(element.classList.contains('active')).to.be.true;
      });

      it('does not hide menu from screenreaders', () => {
        expect(element.getAttribute('aria-hidden')).to.eq(null);
      });

      it('does not make the menu untabbable', () => {
        expect(element.getAttribute('tabindex')).to.eq(null);
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
        expect(element.classList.contains('active')).to.be.false;
      });

      it('hides the menu from screenreaders', () => {
        expect(element.getAttribute('aria-hidden')).to.eq('true');
      });

      it('makes the menu untabbable', () => {
        expect(element.getAttribute('tabindex')).to.eq('-1');
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

        expect(element.classList.contains('active')).to.be.false;
        expect(element.getAttribute('aria-hidden')).to.eq('true');
        expect(element.getAttribute('tabindex')).to.eq('-1');
      });

      it('shows the menu when isOpen is changed from false to true', () => {
        ReactDOM.render(React.createElement(SideMenu, getProps({ isOpen: false })), node);
        ReactDOM.render(React.createElement(SideMenu, getProps({ isOpen: true })), node);
        const element = node.querySelector('.side-menu');

        expect(element.classList.contains('active')).to.be.true;
        expect(element.getAttribute('aria-hidden')).to.eq(null);
        expect(element.getAttribute('tabindex')).to.eq(null);
      });
    });
  });

  describe('isAnchoredLeft', () => {
    it('adds the menu-anchor-left class if true', () => {
      const element = renderComponent(SideMenu, getProps());
      expect(element.classList.contains('menu-anchor-left')).to.be.true;
      expect(element.classList.contains('menu-anchor-right')).to.be.false;
    });

    it('adds the menu-anchor-right class if false', () => {
      const element = renderComponent(SideMenu, getProps({
        isAnchoredLeft: false
      }));
      expect(element.classList.contains('menu-anchor-right')).to.be.true;
      expect(element.classList.contains('menu-anchor-left')).to.be.false;
    });
  });

  describe('onDismiss', () => {
    it('renders a dismiss button', () => {
      const element = renderComponent(SideMenu, getProps());
      expect(element.querySelector('button.menu-header-dismiss')).to.exist;
    });

    it('invokes the onDismiss handler on click on dismiss button', () => {
      const stub = sinon.stub();
      const element = renderComponent(SideMenu, getProps({
        onDismiss: stub
      }));
      Simulate.click(element.querySelector('button.menu-header-dismiss'));

      expect(stub.calledOnce).to.be.true;
    });
  });

  it('renders children', () => {
    const element = renderComponent(SideMenu, getProps({
      children: <div className="test-child" />
    }));
    expect(element.querySelector('.test-child')).to.exist;
  });
});
