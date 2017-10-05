import { assert } from 'chai';
import { Header } from 'components/header';
import { FeatureFlags } from 'common/feature_flags';

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
      window.serverConfig.currentUser = { rights: [ ] };
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
      window.serverConfig.currentUser = { rights: [ 'can_see_all_assets_tab_siam' ] };
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

});
