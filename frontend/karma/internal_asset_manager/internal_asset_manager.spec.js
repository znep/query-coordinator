import _ from 'lodash';
import React from 'react';
import { mount, shallow } from 'enzyme';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import sinon from 'sinon';

import InternalAssetManager from 'internal_asset_manager/components/internal_asset_manager';
import * as constants from 'common/components/AssetBrowser/lib/constants';
import { FeatureFlags } from 'common/feature_flags';

import { useTestTranslations } from 'common/i18n';
import sharedTranslations from 'common/i18n/config/locales/en.yml';
import mockCeteraFetchResponse from './data/mock_cetera_fetch_response';

const store = configureMockStore()();

const internalAssetManagerProps = (options = {}) => ({
  store: store,
  ...options
});

const mockFeatureFlags = {
  disable_authority_badge: false,
  stories_enabled: true,
  usaid_features_enabled: false
};

describe('<InternalAssetManager />', () => {
  const currentUser = _.cloneDeep(window.socrata.currentUser);
  let ceteraStub;

  beforeEach(() => {
    useTestTranslations(sharedTranslations.en);
    window.socrata.approvals = { settings: { official: 'automatic', community: 'manual' } };
    FeatureFlags.useTestFixture(mockFeatureFlags);
    ceteraStub = sinon.stub(window, 'fetch').resolves(mockCeteraFetchResponse);
  });

  afterEach(() => {
    delete window.socrata.approvals;
    ceteraStub.restore();
  });

  describe('default props', () => {
    beforeEach(() => {
      _.remove(window.socrata.currentUser.rights, (right) => right === 'can_see_all_assets_tab_siam');
    });

    afterEach(() => {
      window.socrata.currentUser = currentUser;
    });

    it('defaults to showFilters and showSearchField as true and showAssetCounts as true', () => {
      const wrapper = mount(<InternalAssetManager {...internalAssetManagerProps()} />);

      assert(
        wrapper.find('.asset-browser .asset-tabs .asset-tab.my-assets.active').length,
        'My Assets should be the active tab'
      );
      assert(
        wrapper.find('.asset-counts').length,
        'asset counts should be present'
      );
      assert(
        wrapper.find('.catalog-filters').length,
        'filters should be present'
      );
      assert(
        wrapper.find('.autocomplete').length,
        'autocomplete search bar should be present'
      );
    });
  });

  describe('tabs', () => {
    describe('when the user has the "can_see_all_assets_tab_siam" right', () => {
      beforeEach(() => {
        window.socrata.currentUser.rights = ['can_see_all_assets_tab_siam'];
      });

      afterEach(() => {
        window.socrata.currentUser = currentUser;
      });

      it('renders the All Assets tab', () => {
        const wrapper = mount(<InternalAssetManager {...internalAssetManagerProps()} />);
        // If you're ever curious about what this mounted element looks like, open the karma test session
        // in your browser (usually at http://0.0.0.0:9443/), then click the DEBUG button. Put a debugger
        // statement in your test code and then in the browser you can do this in the JS console:
        // $('body').html(mount(<InternalAssetManager />).html())
        // This will replace the body of the document with the HTML of the React component under test.
        assert(
          wrapper.find('.asset-browser .header .asset-tabs .asset-tab.all-assets').length,
          'Expected the All Assets tab to be rendered'
        );
      });
    })

    describe('when the user does not have the "can_see_all_assets_tab_siam" right', () => {
      beforeEach(() => {
        window.socrata.currentUser.rights = [];
      });

       afterEach(() => {
        window.socrata.currentUser = currentUser;
      });

      it('does not render the All Assets tab', () => {
        const wrapper = mount(<InternalAssetManager {...internalAssetManagerProps({
          header: { activeTab: constants.MY_ASSETS_TAB }
        })} />);

        assert(
          wrapper.find('.asset-browser .header .asset-tabs .asset-tab.settings').length <= 0,
          'Expected the All Assets tab to NOT be rendered'
        );
      });
    })
  });
});
