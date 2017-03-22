import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent  } from '../../helpers';
import { ExpandableMenuListItem } from 'components/SideMenu';

describe('ExpandableMenuListItem', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      iconName: 'close-2',
      text: 'Menu Item',
      onClick: _.noop,
      children: null
    });
  }

  const getButton = (el) => el.querySelector('button');
  const getIcons = (el) => el.querySelectorAll('.socrata-icon');

  it('renders', () => {
    const element = renderComponent(ExpandableMenuListItem, getProps());
    expect(element).to.exist;
  });

  describe('iconName', () => {
    it('renders if provided', () => {
      const element = renderComponent(ExpandableMenuListItem, getProps());
      // one for the icon, one for the chevron
      expect(getIcons(element).length).to.eq(2);
    });

    it('does not render if not provided', () => {
      const element = renderComponent(ExpandableMenuListItem, getProps({
        iconName: null
      }));
      // none for the icon, one for the chevron
      expect(getIcons(element).length).to.eq(1);
    });
  });

  it('renders the text', () => {
    const element = renderComponent(ExpandableMenuListItem, getProps());
    expect(element.innerText).to.contain('Menu Item');
  });

  it('does not display the contents if isOpen is false', () => {
    const element = renderComponent(ExpandableMenuListItem, getProps({
      children: <div className="test-child" />,
      isOpen: false
    }));
    expect(getButton(element).classList.contains('active')).to.equal(false);
  });

  it('displays the contents if isOpen is true', () => {
    const element = renderComponent(ExpandableMenuListItem, getProps({
      children: <div className="test-child" />,
      isOpen: true
    }));
    expect(getButton(element).classList.contains('active')).to.equal(true);
  });

  it('invokes onClick when clicked', () => {
    const stub = sinon.stub();
    const element = renderComponent(ExpandableMenuListItem, getProps({
      onClick: stub
    }));
    Simulate.click(getButton(element));

    expect(stub.calledOnce).to.be.true;
  });
});
