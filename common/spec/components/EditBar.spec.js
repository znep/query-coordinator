import _ from 'lodash';
import React from 'react';
import EditBar from 'components/EditBar';
import Picklist from 'components/Picklist';
import { Simulate } from 'react-dom/test-utils';
import { renderPureComponent } from '../helpers';

/* eslint-disable new-cap */
describe('EditBar', () => {
  const getMenu = (el) => el.querySelector('.btn-menu');
  const getName = (el) => el.querySelector('.page-name');

  it('renders', () => {
    const element = renderPureComponent(EditBar({}));
    assert.isNotNull(element);
  });

  describe('menu button', () => {
    it('renders the provided icon', () => {
      const element = renderPureComponent(EditBar({ menuIcon: 'cool-icon' }));
      assert.deepEqual(getMenu(element).classList.contains('cool-icon'), true);
    });

    it('defaults the icon to the cards icon', () => {
      const element = renderPureComponent(EditBar({}));
      assert.deepEqual(getMenu(element).classList.contains('socrata-icon-cards'), true);
    });

    it('renders an aria label', () => {
      const element = renderPureComponent(EditBar({ menuLabel: 'Menu' }));
      assert.deepEqual(getMenu(element).getAttribute('aria-label'), 'Menu');
    });

    it('invokes the click handler on click', () => {
      const stub = sinon.stub();
      const element = renderPureComponent(EditBar({ onClickMenu: stub }));

      Simulate.click(getMenu(element));
      assert.equal(stub.called, true);
    });
  });

  describe('page name', () => {
    it('renders if provided', () => {
      const element = renderPureComponent(EditBar({ name: 'Elephants Frolicking' }));
      assert.deepEqual(getName(element).innerText, 'Elephants Frolicking');
    });

    it('does not render if not provided', () => {
      const element = renderPureComponent(EditBar({}));
      assert.isNull(getName(element));
    });

    it('calls onClickName when clicked', () => {
      const stub = sinon.stub();
      const element = renderPureComponent(EditBar({ name: 'oh', onClickName: stub }));

      Simulate.click(getName(element));
      assert.equal(stub.called, true);
    });

    it('does not add the page-name-clickable class when onClickName is absent', () => {
      const element = renderPureComponent(EditBar({ name: 'oh' }));
      assert.equal(getName(element).classList.contains('page-name-clickable'), false);
    });

    it('adds the page-name-clickable class when onClickName is present', () => {
      const element = renderPureComponent(EditBar({ name: 'oh', onClickName: _.noop }));
      assert.equal(getName(element).classList.contains('page-name-clickable'), true);
    });
  });

  it('renders children elements', () => {
    const element = renderPureComponent(EditBar({ children: React.createElement(Picklist) }));
    assert.isNotNull(element.querySelector('.picklist'));
  });
});
/* eslint-enable new-cap */
