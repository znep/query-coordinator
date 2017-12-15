import React from 'react';
import { shallow } from 'enzyme';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import sinon from 'sinon';

import UserProfile from 'userProfile/components/user_profile';
import * as constants from 'common/components/AssetBrowser/lib/constants';

const store = configureMockStore()();

const userProfileProps = (options = {}) => ({
  store: store,
  ...options
});

const initialStateStub = (id) => ({
  initialState: {
    targetUserId: id
  }
});

const serverConfigStub = (id) => ({
  currentUser: { id }
});

describe('<UserProfile /> component', () => {
  var sandbox = sinon.createSandbox();

  let wrapper;
  let tabs;

  beforeEach(() => {
    wrapper = shallow(<UserProfile {...userProfileProps()} />);
    tabs = wrapper.props().tabs;
  });

  it(`should always show ${constants.MY_ASSETS_TAB} tab`, () => {
    assert.include(
      Object.keys(tabs),
      constants.MY_ASSETS_TAB
    );
  });

  describe('targetUserId and currentUser.id are not equal', () => {
    before(() => {
      sandbox.stub(window, 'socrata').returns(initialStateStub(undefined));
      sandbox.stub(window, 'serverConfig').returns(serverConfigStub('legal_4x4'));
    });

    after(() => {
      sandbox.restore();
    });

    it(`should not show ${constants.SHARED_TO_ME_TAB} tab`, () => {
      assert.notInclude(
        Object.keys(tabs),
        constants.SHARED_TO_ME_TAB
      );
    });

    it(`${constants.MY_ASSETS_TAB} tab should have baseFilter of open visibility`, () => {
      assert.include(
        tabs[constants.MY_ASSETS_TAB].props.baseFilters,
        { visibility: 'open' }
      );
    });
  });

  describe('targetUserId and currentUser.id are equal', () => {
    before(() => {
      let userId = 'legal_4x4';
      sandbox.stub(window, 'socrata').value(initialStateStub(userId));
      sandbox.stub(window, 'serverConfig').value(serverConfigStub(userId));
    });

    after(() => {
      sandbox.restore();
    });

    it(`should show ${constants.SHARED_TO_ME_TAB} tab`, () => {
      assert.include(
        Object.keys(tabs),
        constants.SHARED_TO_ME_TAB
      );
    });

    it(`${constants.MY_ASSETS_TAB} tab should not have baseFilter of open visibility`, () => {
      assert.notInclude(
        tabs[constants.MY_ASSETS_TAB].props.baseFilters,
        { visibility: 'open' }
      );
    });
  });
});
