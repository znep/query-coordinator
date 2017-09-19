import _ from 'lodash';
import { Simulate } from 'react-dom/test-utils';
import { MenuListItem } from 'components/SideMenu';
import { renderPureComponent  } from '../../helpers';

/* eslint-disable new-cap */
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
    assert.isNotNull(element);
  });

  describe('iconName', () => {
    it('renders if provided', () => {
      assert.isNotNull(element.querySelector('.socrata-icon'));
    });

    it('does not render if not provided', () => {
      element = renderPureComponent(MenuListItem(getProps({
        iconName: null
      })));
      assert.isNull(element.querySelector('.socrata-icon'));
    });
  });

  it('renders the text', () => {
    assert.include(element.innerText, 'Menu Item');
  });

  it('invokes onClick when clicked', () => {
    const stub = sinon.stub();
    element = renderPureComponent(MenuListItem(getProps({
      onClick: stub
    })));
    Simulate.click(element.querySelector('button'));

    assert.isTrue(stub.calledOnce);
  });
});
/* eslint-enable new-cap */
