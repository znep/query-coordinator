import { assert } from 'chai';
import { shallow } from 'enzyme';
import I18nJS from 'i18n-js';

import { Header } from 'components/header';

const headerProps = (props = {}) => ({
  activeTab: 'myQueue',
  changeTab: () => {},
  I18n: I18nJS,
  ...props
});

describe('components/Header', () => {
  it('renders a header containing breadcrumbs and tab links', () => {
    const wrapper = shallow(<Header {...headerProps()} />);
    assert.isTrue(wrapper.find('.header').exists());
    assert.isTrue(wrapper.find('.header .breadcrumbs').exists());
    assert.isTrue(wrapper.find('.header .tab-links').exists());

    assert.equal(wrapper.find('.header .breadcrumbs').text(), 'Administration<SocrataIcon />Approval Requests');
  });

  describe('tab links', () => {
    it('does not add an "active" class to any tab link if the activeTab prop is null', () => {
      const wrapper = shallow(<Header {...headerProps({ activeTab: null })} />);
      assert.isFalse(wrapper.find('.tab-link.active').exists());
    });

    it('adds an "active" class to the tab link matching the activeTab prop', () => {
      const wrapper = shallow(<Header {...headerProps({ activeTab: 'settings' })} />);
      assert.isTrue(wrapper.find('.tab-link.settings.active').exists());
    });
  });

});
