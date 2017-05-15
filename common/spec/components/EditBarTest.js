import _ from 'lodash';
import React from 'react';
import EditBar from 'components/EditBar';
import Picklist from 'components/Picklist';
import { Simulate } from 'react-addons-test-utils';
import { renderPureComponent } from '../helpers';

describe('EditBar', () => {
  const getMenu = (el) => el.querySelector('.btn-menu');
  const getName = (el) => el.querySelector('.page-name');

  it('renders', () => {
    const element = renderPureComponent(EditBar({}));
    expect(element).to.exist;
  });

  describe('menu button', () => {
    it('renders the provided icon', () => {
      const element = renderPureComponent(EditBar({ menuIcon: 'cool-icon' }));
      expect(getMenu(element).classList.contains('cool-icon')).to.eq(true);
    });

    it('defaults the icon to the cards icon', () => {
      const element = renderPureComponent(EditBar({}));
      expect(getMenu(element).classList.contains('socrata-icon-cards')).to.eq(true);
    });

    it('renders an aria label', () => {
      const element = renderPureComponent(EditBar({ menuLabel: 'Menu' }));
      expect(getMenu(element).getAttribute('aria-label')).to.eq('Menu');
    });

    it('invokes the click handler on click', () => {
      const stub = sinon.stub();
      const element = renderPureComponent(EditBar({ onClickMenu: stub }));

      Simulate.click(getMenu(element));
      expect(stub.called).to.equal(true);
    });
  });

  describe('page name', () => {
    it('renders if provided', () => {
      const element = renderPureComponent(EditBar({ name: 'Elephants Frolicking' }));
      expect(getName(element).innerText).to.eq('Elephants Frolicking');
    });

    it('does not render if not provided', () => {
      const element = renderPureComponent(EditBar({}));
      expect(getName(element)).to.not.exist;
    });

    it('calls onClickName when clicked', () => {
      const stub = sinon.stub();
      const element = renderPureComponent(EditBar({ name: 'oh', onClickName: stub }));

      Simulate.click(getName(element));
      expect(stub.called).to.equal(true);
    });

    it('does not add the page-name-clickable class when onClickName is absent', () => {
      const element = renderPureComponent(EditBar({ name: 'oh' }));
      expect(getName(element).classList.contains('page-name-clickable')).to.equal(false);
    });

    it('adds the page-name-clickable class when onClickName is present', () => {
      const element = renderPureComponent(EditBar({ name: 'oh', onClickName: _.noop }));
      expect(getName(element).classList.contains('page-name-clickable')).to.equal(true);
    });
  });

  it('renders children elements', () => {
    const element = renderPureComponent(EditBar({ children: React.createElement(Picklist) }));
    expect(element.querySelector('.picklist')).to.exist;
  });
});
