import React from 'react';
import { assert } from 'chai';
import { mount, shallow } from 'enzyme';

import { Header } from 'common/components/AssetBrowser/components/header';
import { ResultsAndFilters } from 'common/components/AssetBrowser/components';
import * as constants from 'common/components/AssetBrowser/lib/constants';

const getProps = (props = {}) => ({
  activeTab: 'myAssets',
  changeTab: () => {},
  isMobile: false,
  tabs: {
    myAssets: {
      component: ResultsAndFilters
    },
    sharedToMe: {
      component: ResultsAndFilters
    },
    allAssets: {
      component: ResultsAndFilters
    }
  },
  ...props
});

describe('components/Header', () => {
  it('renders the tabs provided in the prop', () => {
    const wrapper = shallow(<Header {...getProps()} />);
    assert.isTrue(wrapper.find('.my-assets').exists());
    assert.isTrue(wrapper.find('.shared-to-me').exists());
    assert.isTrue(wrapper.find('.all-assets').exists());
  });
});
