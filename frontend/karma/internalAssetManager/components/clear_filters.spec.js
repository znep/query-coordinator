import React from 'react';
import { mount, shallow } from 'enzyme';
import { assert } from 'chai';
import { spy } from 'sinon';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { ClearFilters } from 'internalAssetManager/components/clear_filters';

import I18nJS from 'i18n-js';

const store = configureMockStore([ thunk ])();

const clearFilterProps = (options = {}) => ({
  allFilters: {},
  buttonStyle: false,
  clearAllFilters: () => {},
  I18n: I18nJS,
  store: store,
  ...options
});

describe('<ClearFilters />', () => {
  describe('default props', () => {
    it('defaults to buttonStyle false and showTitle true', () => {
      const wrapper = mount(<ClearFilters {...clearFilterProps()} />);
      assert.equal(false, ClearFilters.defaultProps.buttonStyle);
      assert.equal(true, ClearFilters.defaultProps.showTitle);
    });
  });

  describe('when there are no filters', () => {
    describe('when showTitle is false', () => {
      it('does not render anything', () => {
        const wrapper = shallow(
          <ClearFilters {...clearFilterProps({showTitle: false})} />
        );

        assert.equal(0, wrapper.find('*').length);
      });
    });

    describe('when showTitle is true', () => {
      it('renders the title', () => {
        const wrapper = shallow(
          <ClearFilters {...clearFilterProps({showTitle: true})} />
        );

        assert.equal(1, wrapper.find('.title').length);
      });
    });
  })

  describe('when there are filters', () => {
    const allFilters = {
      'assetTypes': 'dataset',
      'authority': 'Official',
      'category': 'Business',
      'onlyRecentlyViewed': true,
      'ownedBy.id': 'tugg-ikce',
      'tag': 'great',
      'visibility': 'open',
      'lolwut': 'nope'  // It is expected that this invalid filter is ignored
    };

    describe('when showTitle is false', () => {
      it('renders the expected filter count', () => {
        const wrapper = shallow(
          <ClearFilters {...clearFilterProps({allFilters, showTitle: false})} />
        );

        assert.equal(1, wrapper.find('.filter-count').length);
        assert.equal('(7)', wrapper.find('.filter-count').text());
      });

      it('still renders the title', () => {
        const wrapper = shallow(
          <ClearFilters {...clearFilterProps({allFilters, showTitle: false})} />
        );

        assert.equal(1, wrapper.find('span.title').length);
      });
    });

    describe('when buttonStyle is false', () => {
      it('renders as an icon', () => {
        const wrapper = shallow(<ClearFilters {...clearFilterProps({allFilters})} />);

        assert.equal(1, wrapper.find('.socrata-icon-close-circle').length);
        assert.equal(0, wrapper.find('.socrata-icon-close').length);
        assert.equal(1, wrapper.find('.clear-filters-wrapper').length);
        assert.equal(0, wrapper.find('.clear-filters-wrapper.button').length);
      });

      it('calls clearAllFilters when clicked', () => {
        const clearFiltersSpy = spy();
        const wrapper = shallow(<ClearFilters {...clearFilterProps({clearAllFilters: clearFiltersSpy, allFilters})} />);

        wrapper.find('.clear-all-filters').simulate('click');
        assert(clearFiltersSpy.calledOnce, 'Expected clearAllFilters to have been invoked');
      });
    })

    describe('when buttonStyle is true', () => {
      it('renders as an button', () => {
        const wrapper = shallow(
          <ClearFilters {...clearFilterProps({buttonStyle: true, allFilters})} />
        );

        assert.equal(0, wrapper.find('.socrata-icon-close-circle').length);
        assert.equal(1, wrapper.find('.socrata-icon-close').length);
        assert.equal(1, wrapper.find('.clear-filters-wrapper.button').length);
      });

      it('calls clearAllFilters when clicked', () => {
        const clearFiltersSpy = spy();
        const wrapper = shallow(
          <ClearFilters {...clearFilterProps({buttonStyle: true, clearAllFilters: clearFiltersSpy, allFilters})} />
        );

        wrapper.find('.clear-filters-wrapper.button').simulate('click');
        assert(clearFiltersSpy.calledOnce, 'Expected clearAllFilters to have been invoked');
      });
    })
  })
});
