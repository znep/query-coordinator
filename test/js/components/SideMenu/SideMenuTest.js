import _ from 'lodash';
import React from 'react';
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
    it('adds the active class if true', () => {
      const element = renderComponent(SideMenu, getProps());
      expect(element.classList.contains('active')).to.be.true;
    });

    it('does not add the active class if false', () => {
      const element = renderComponent(SideMenu, getProps({
        isOpen: false
      }));
      expect(element.classList.contains('active')).to.be.false;
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
