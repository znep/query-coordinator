import _ from 'lodash';
import React from 'react';
import { shallow } from 'enzyme';

import { SocrataIcon } from 'common/components';
import { MenuListItem } from 'components/SideMenu';

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
    element = shallow(<MenuListItem {...getProps()} />);
  });

  describe('iconName', () => {
    it('renders if provided', () => {
      assert.lengthOf(element.find(SocrataIcon), 1);
    });

    it('does not render if not provided', () => {
      const props = getProps({
        iconName: null
      });
      element = shallow(<MenuListItem {...props} />);
      assert.lengthOf(element.find(SocrataIcon), 0);
    });
  });

  it('renders the text', () => {
    assert.include(element.text(), 'Menu Item');
  });

  it('invokes onClick when the button is clicked', () => {
    const stub = sinon.stub();
    const props = getProps({
      onClick: stub
    });
    element = shallow(<MenuListItem {...props} />);

    element.find('button').prop('onClick')();

    sinon.assert.calledOnce(stub);
  });
});
