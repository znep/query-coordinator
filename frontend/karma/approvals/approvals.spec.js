import _ from 'lodash';
import React from 'react';
import { mount, shallow } from 'enzyme';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import sinon from 'sinon';

import Approvals from 'approvals/components/approvals';

import { useTestTranslations } from 'common/i18n';
import sharedTranslations from 'common/i18n/config/locales/en.yml';
import mockCeteraFetchResponse from './data/mock_cetera_fetch_response';

const store = configureMockStore()();

const approvalsProps = (options = {}) => ({
  store: store,
  ...options
});

describe('<Approvals />', () => {
  let ceteraStub;

  beforeEach(() => {
    useTestTranslations(sharedTranslations.en);
    ceteraStub = sinon.stub(window, 'fetch').resolves(mockCeteraFetchResponse);
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
        'asset counts should not be present'
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
    describe('when the user has the "configure_approvals" right', () => {
      const currentUser = _.cloneDeep(window.socrata.currentUser);

      beforeEach(() => {
        window.socrata.currentUser.rights = ['configure_approvals'];
      });

      afterEach(() => {
        window.socrata.currentUser = currentUser;
      });

      it('renders a link to the Settings page', () => {
        const wrapper = mount(<Approvals {...approvalsProps()} />);
        // If you're ever curious about what this mounted element looks like, open the karma test session
        // in your browser (usually at http://0.0.0.0:9443/), then click the DEBUG button. Put a debugger
        // statement in your test code and then in the browser you can do this in the JS console:
        // $('body').html(mount(<Approvals />).html())
        // This will replace the body of the document with the HTML of the React component under test.
        assert(
          wrapper.find('.asset-browser .header .settings_link').length,
          'Expected the Settings link to be rendered'
        );
      });
    })

    describe('when the user does not have the "configure_approvals" right', () => {
      beforeEach(() => {
        window.socrata.currentUser.rights = [];
      });
      it('does not render the settings tab', () => {
        const wrapper = mount(<Approvals {...approvalsProps()} />);
        assert(
          wrapper.find('.asset-browser .header .asset-tabs .asset-tab.settings').length <= 0,
          'Expected the Settings tab to NOT be rendered'
        );
      });
    })
  });

  describe('filters', () => {
    it('does not render an authority filter', () => {
      const wrapper = mount(<Approvals {...approvalsProps()} />);
      assert(
        wrapper.find('.asset-browser .filter-content .filter-section.authority').length <= 0,
        'Expected the Authority filter to NOT be rendered'
      );
    });

    it('does not render a visibility filter', () => {
      const wrapper = mount(<Approvals {...approvalsProps()} />);
      assert(
        wrapper.find('.asset-browser .filter-content .filter-section.visibility').length <= 0,
        'Expected the Visibility filter to NOT be rendered'
      );
    });
  });
});
