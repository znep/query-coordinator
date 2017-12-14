import React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { SortDropdown } from 'common/components/AssetBrowser/components/sort_dropdown';
import sinon from 'sinon';
import _ from 'lodash';

describe('components/SortDropdown', function() {
  const sortDropdownProps = {
    changeSortOrder: () => {},
    order: 'relevance'
  };

  const getProps = (props = {}) => ({ ...sortDropdownProps, ...props });

  it('renders', function() {
    const wrapper = mount(<SortDropdown {...getProps()} />);
    assert.isDefined(wrapper);
    assert.lengthOf(wrapper.find('.sort-dropdown'), 1);
  });

  it('has options for each sort type', function() {
    const sortTypes = [
      'Most Relevant',
      'Most Accessed',
      'Alphabetical',
      'Recently Added',
      'Recently Updated'
    ];

    const wrapper = mount(<SortDropdown {...getProps()} />);
    const options = wrapper.find('.picklist-option .picklist-title');

    assert.equal(options.length, sortTypes.length);

    _.forEach(options.nodes, (option) => {
      assert.isTrue(sortTypes.indexOf(option.textContent) > -1);
    });
  });

  it('calls changeSortOrder when an option is selected', function() {
    const spy = sinon.spy();
    const wrapper = mount(<SortDropdown {...getProps({ changeSortOrder: spy })} />);

    const lastUpdatedDateOption = wrapper.find('.picklist-option').
      findWhere(option => option.text() === 'Recently Updated').first();
    lastUpdatedDateOption.simulate('click');

    sinon.assert.calledWith(spy, { title: 'Recently Updated', value: 'lastUpdatedDate' });
  });
});
