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

  it('renders', () => {
    const element = renderComponent(ExpandableMenuListItem, getProps());
    expect(element).to.exist;
  });

  describe('iconName', () => {
    it('renders if provided', () => {
      const element = renderComponent(ExpandableMenuListItem, getProps());
      // one for the icon, one for the chevron
      expect(element.querySelectorAll('.socrata-icon').length).to.eq(2);
    });

    it('does not render if not provided', () => {
      const element = renderComponent(ExpandableMenuListItem, getProps({
        iconName: null
      }));
      // none for the icon, one for the chevron
      expect(element.querySelectorAll('.socrata-icon').length).to.eq(1);
    });
  });

  it('renders the text', () => {
    const element = renderComponent(ExpandableMenuListItem, getProps());
    expect(element.innerText).to.contain('Menu Item');
  });

  it('does not display the contents on initial load', () => {
    const element = renderComponent(ExpandableMenuListItem, getProps({
      children: <div className="test-child" />
    }));
    expect(element.querySelector('.test-child')).to.not.be.visible;
  });

  it('does displays the contents on click', () => {
    const element = renderComponent(ExpandableMenuListItem, getProps({
      children: <div className="test-child" />
    }));
    Simulate.click(element.querySelector('button'));

    expect(element.querySelector('.test-child')).to.be.visible;
  });

  it('invokes onClick when clicked', () => {
    const stub = sinon.stub();
    const element = renderComponent(ExpandableMenuListItem, getProps({
      onClick: stub
    }));
    Simulate.click(element.querySelector('button'));

    expect(stub.calledOnce).to.be.true;
  });
});
