import React from 'react';
import { mount, shallow } from 'enzyme';
import { assert } from 'chai';
import { spy } from 'sinon';

import { ClearFilters } from 'internalAssetManager/components/clear_filters';

describe('<ClearFilters />', () => {

  describe('default props', () => {
    it('defaults to buttonStyle false and showTitle true', () => {
      const wrapper = mount(<ClearFilters clearAllFilters={() => {}} allFilters={{}} />);
      assert.equal(false, wrapper.props().buttonStyle);
      assert.equal(true, wrapper.props().showTitle);
    });
  });

  describe('when there are no filters', () => {
    describe('when showTitle is false', () => {
      it('does not render anything', () => {
        const wrapper = shallow(
          <ClearFilters buttonStyle={false} clearAllFilters={() => {}} allFilters={{}} showTitle={false} />
        );

        assert.equal(0, wrapper.find('*').length);
      });
    });

    describe('when showTitle is true', () => {
      it('renders the title', () => {
        const wrapper = shallow(
          <ClearFilters buttonStyle={false} clearAllFilters={() => {}} allFilters={{}} showTitle={true} />
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
          <ClearFilters clearAllFilters={() => {}} allFilters={allFilters} showTitle={false} />
        );

        assert.equal(1, wrapper.find('.filter-count').length);
        assert.equal('(7)', wrapper.find('.filter-count').text());
      });

      it('still renders the title', () => {
        const wrapper = shallow(
          <ClearFilters clearAllFilters={() => {}} allFilters={allFilters} showTitle={false} />
        );

        assert.equal(1, wrapper.find('span.title').length);
      });
    });

    describe('when buttonStyle is false', () => {
      it('renders as an icon', () => {
        const wrapper = shallow(<ClearFilters clearAllFilters={() => {}} allFilters={allFilters} />);

        assert.equal(1, wrapper.find('.socrata-icon-close-circle').length);
        assert.equal(0, wrapper.find('.socrata-icon-close').length);
        assert.equal(1, wrapper.find('.clear-filters-wrapper').length);
        assert.equal(0, wrapper.find('.clear-filters-wrapper.button').length);
      });

      it('calls clearAllFilters when clicked', () => {
        const clearFiltersSpy = spy();
        const wrapper = shallow(<ClearFilters clearAllFilters={clearFiltersSpy} allFilters={allFilters} />);

        wrapper.find('.clear-all-filters').simulate('click');
        assert(clearFiltersSpy.calledOnce, 'Expected clearAllFilters to have been invoked');
      });
    })

    describe('when buttonStyle is true', () => {
      it('renders as an button', () => {
        const wrapper = shallow(
          <ClearFilters buttonStyle clearAllFilters={() => {}} allFilters={allFilters} />
        );

        assert.equal(0, wrapper.find('.socrata-icon-close-circle').length);
        assert.equal(1, wrapper.find('.socrata-icon-close').length);
        assert.equal(1, wrapper.find('.clear-filters-wrapper.button').length);
      });

      it('calls clearAllFilters when clicked', () => {
        const clearFiltersSpy = spy();
        const wrapper = shallow(
          <ClearFilters buttonStyle clearAllFilters={clearFiltersSpy} allFilters={allFilters} />
        );

        wrapper.find('.clear-filters-wrapper.button').simulate('click');
        assert(clearFiltersSpy.calledOnce, 'Expected clearAllFilters to have been invoked');
      });
    })
  })
});
