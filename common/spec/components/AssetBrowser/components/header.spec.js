import { assert } from 'chai';
import { Header } from 'common/components/AssetBrowser/components/header';
import { FeatureFlags } from 'common/feature_flags';
import { renderComponentWithPropsAndStore } from 'common/spec/helpers';
import { MY_ASSETS_TAB, SHARED_TO_ME_TAB } from 'common/components/AssetBrowser/lib/constants';

let savedCurrentUser = window.serverConfig.currentUser;

describe('components/Header', () => {

  it('does render My Assets', () => {
    const element = renderComponentWithPropsAndStore(Header);
    assert.isNotNull(element);
    assert.equal(element.querySelectorAll('.my-assets').length, 1);
  });

  describe('when not a privileged user', () => {
    before(() => {
      savedCurrentUser = window.serverConfig.currentUser;
      window.serverConfig.currentUser = { rights: [] };
    });

    after(() => {
      window.serverConfig.currentUser = savedCurrentUser;
    });

    it('does not render All Assets', () => {
      const element = renderComponentWithPropsAndStore(Header);
      assert.isNotNull(element);
      assert.equal(element.querySelectorAll('.all-assets').length, 0);
    });
  });

  describe('when a privileged user', () => {
    before(() => {
      savedCurrentUser = window.serverConfig.currentUser;
      window.serverConfig.currentUser = { rights: ['can_see_all_assets_tab_siam'] };
    });

    after(() => {
      window.serverConfig.currentUser = savedCurrentUser;
    });

    it('does render All Assets', () => {
      const element = renderComponentWithPropsAndStore(Header);
      assert.isNotNull(element);
      assert.equal(element.querySelectorAll('.all-assets').length, 1);
    });
  });

  describe('tabsToHide', () => {
    describe('when not passed', () => {
      it('renders all tabs', () => {
        const element = renderComponentWithPropsAndStore(Header);
        assert.isNotNull(element);
        assert.equal(element.querySelectorAll('.my-assets').length, 1);
        assert.equal(element.querySelectorAll('.shared-to-me').length, 1);
      });
    });

    describe('when passed', () => {
      it('hides single tab', () => {
        const props = { 'tabsToHide': [MY_ASSETS_TAB] };
        const element = renderComponentWithPropsAndStore(Header, props);
        assert.isNotNull(element);
        assert.equal(element.querySelectorAll('.my-assets').length, 0);
        assert.equal(element.querySelectorAll('.shared-to-me').length, 1);
      });

      it('hides multiple tabs', () => {
        const props = { 'tabsToHide': [MY_ASSETS_TAB, SHARED_TO_ME_TAB] };
        const element = renderComponentWithPropsAndStore(Header, props);
        assert.isNotNull(element);
        assert.equal(element.querySelectorAll('.my-assets').length, 0);
        assert.equal(element.querySelectorAll('.shared-to-me').length, 0);
      });
    });
  });
});
