import _ from 'lodash';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import { MenuListItem } from 'components/SideMenu';
import { renderPureComponent  } from '../../helpers';

describe('MenuListItem', () => {
  let element;

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      iconName: 'close-2',
      text: 'Menu Item',
      onClick: _.noop
    });
  }

  beforeEach(() => {
    element = renderPureComponent(MenuListItem(getProps()));
  });

  it('renders', () => {
    expect(element).to.exist;
  });

  describe('iconName', () => {
    it('renders if provided', () => {
      expect(element.querySelector('.socrata-icon')).to.exist;
    });

    it('does not render if not provided', () => {
      element = renderPureComponent(MenuListItem(getProps({
        iconName: null
      })));
      expect(element.querySelector('.socrata-icon')).to.not.exist;
    });
  });

  it('renders the text', () => {
    expect(element.innerText).to.contain('Menu Item');
  });

  it('invokes onClick when clicked', () => {
    const stub = sinon.stub();
    element = renderPureComponent(MenuListItem(getProps({
      onClick: stub
    })));
    Simulate.click(element.querySelector('button'));

    expect(stub.calledOnce).to.be.true;
  });
});
