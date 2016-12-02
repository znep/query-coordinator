import React from 'react';
import EditBar from 'components/EditBar';
import Picklist from 'components/Picklist';
import { Simulate } from 'react-addons-test-utils';
import { renderPureComponent } from '../helpers';

describe('EditBar', () => {
  const getMenu = (element) => element.querySelector('.btn-menu');

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

      expect(stub.called).to.eq(true);
    });
  });

  describe('page name', () => {
    it('renders if provided', () => {
      const element = renderPureComponent(EditBar({ name: 'Elephants Frolicking' }));
      expect(element.querySelector('.page-name').innerText).to.eq('Elephants Frolicking');
    });

    it('does not render if not provided', () => {
      const element = renderPureComponent(EditBar({}));
      expect(element.querySelector('.page-name')).to.not.exist;
    });
  });

  it('renders children elements', () => {
    const element = renderPureComponent(EditBar({ children: React.createElement(Picklist) }));
    expect(element.querySelector('.picklist')).to.exist;
  });
});
