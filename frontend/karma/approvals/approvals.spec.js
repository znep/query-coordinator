import React from 'react';
import { mount, shallow } from 'enzyme';
import { assert } from 'chai';
import * as sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import Approvals from 'approvals/components/approvals';
import * as constants from 'common/components/AssetBrowser/lib/constants';
import { Settings } from 'common/components/AssetBrowser/components/approvals/settings';
import { ResultsAndFilters } from 'common/components/AssetBrowser/components';
import { ApprovalActionButtons } from 'common/components/AssetBrowser/components';

import { useTestTranslations } from 'common/i18n';
import sharedTranslations from 'common/i18n/config/locales/en.yml';
import mockCeteraFetchResponse from './data/mock_cetera_fetch_response';

const store = configureMockStore([thunk])();

const approvalsProps = (options = {}) => ({
  store: store,
  ...options
});

describe.only('<Approvals />', () => {
  let ceteraStub;

  beforeEach(() => {
    useTestTranslations(sharedTranslations.en);
    ceteraStub = sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(mockCeteraFetchResponse)));
  });

  afterEach(() => {
    ceteraStub.restore();
  });

  describe('default props', () => {
    it('defaults to showFilters and showSearchField as true and showAssetCounts as false', () => {
      const wrapper = mount(<Approvals {...approvalsProps()} />);

      assert(
        wrapper.find('.asset-browser .asset-tabs .asset-tab.my-queue.active').length,
        'My Queue should be the active tab'
      );
      assert(
        wrapper.find('.catalog-results .asset-counts').length <= 0,
        'asset counts should be present'
      );
      assert(
        wrapper.find('.catalog-filters').length,
        'filters should be present'
      );
      // An unfortunate consequence of using css modules is non-deterministic class names, so we fall
      // back to matching against one of the internal elements of the autocomplete search component.
      assert(
        wrapper.find('.socrata-icon-search').length,
        'autocomplete search bar should be present'
      );
    });
  });

  describe('tabs', () => {
    describe('when the user has the "configure_approvals" right', () => {
      let currentUser = window.serverConfig.currentUser;

      beforeEach(() => {
        currentUser = window.serverConfig.currentUser;
        window.serverConfig.currentUser.rights = ['configure_approvals'];
      });

      afterEach(() => {
        window.serverConfig.currentUser = currentUser;
      });

      it('renders the Settings tab', () => {
        const wrapper = mount(<Approvals {...approvalsProps()} />);
        // If you're ever curious about what this mounted element looks like, open the karma test session
        // in your browser (usually at http://0.0.0.0:9443/), then click the DEBUG button. Put a debugger
        // statement in your test code and then in the browser you can do this in the JS console:
        // $('body').html(mount(<Approvals />).html())
        // This will replace the body of the document with the HTML of the React component under test.
        assert(wrapper.find('.asset-browser .header .asset-tabs .asset-tab.settings').length);
      });
    })

    describe('when the user does not have the "configure_approvals" right', () => {
      beforeEach(() => {
        window.serverConfig.currentUser.rights = [];
      });
      it('does not render the settings tab', () => {
        const wrapper = mount(<Approvals {...approvalsProps()} />);
        assert(wrapper.find('.asset-browser .header .asset-tabs .asset-tab.settings').length <= 0);
      });
    })
  });
});
