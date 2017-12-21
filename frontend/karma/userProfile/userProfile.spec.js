import React from 'react';
import { mount, shallow } from 'enzyme';
import { assert } from 'chai';
import configureMockStore from 'redux-mock-store';
import sinon from 'sinon';
import _ from 'lodash';

import mockCeteraFetchResponse from './data/mock_cetera_fetch_response';
import airbrake from 'common/airbrake';

import UserProfile from 'userProfile/components/user_profile';
import * as constants from 'common/components/AssetBrowser/lib/constants';

const store = configureMockStore()();

const userProfileProps = (options = {}) => ({
  store,
  ...options
});

var sandbox = sinon.createSandbox();

const stubTargetUserId = (id) => {
  const staticDataStub = _.cloneDeep(window.socrata.assetBrowser.staticData);
  _.set(staticDataStub, 'targetUserId', id);
  sandbox.stub(window.socrata.assetBrowser, 'staticData').value(staticDataStub);
};

const stubCurrentUserId = (id) => {
  const currentUserStub = _.cloneDeep(window.socrata.currentUser);
  _.set(currentUserStub, 'id', id);
  sandbox.stub(window.socrata, 'currentUser').value(currentUserStub);
};

const stubVisibility = (args) => {
  const { hasRole, hasAdminFlag } = args;
  const visibilityStub = _.cloneDeep(window.socrata);

  if (!hasRole) {
    _.unset(visibilityStub, 'currentUser.roleId');
  }

  if (!hasAdminFlag) {
    _.set(visibilityStub, 'currentUser.flags', []);
  }

  sandbox.stub(window, 'socrata').value(visibilityStub);
};

describe('<UserProfile /> component', () => {
  let wrapper;
  let tabs;
  let airBrakeStub;

  beforeEach(() => {
    wrapper = shallow(<UserProfile {...userProfileProps()} />);
    tabs = wrapper.props().tabs;
    airBrakeStub = sinon.stub(airbrake, 'notify');
  });

  afterEach(() => {
    airBrakeStub.restore();
  });

  it(`should always show ${constants.MY_ASSETS_TAB} tab`, () => {
    assert.include(
      Object.keys(tabs),
      constants.MY_ASSETS_TAB
    );
  });

  describe('targetUserId and currentUser.id are not equal', () => {
    before(() => {
      stubTargetUserId(undefined);
      stubCurrentUserId('legal_4x4');
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
      stubTargetUserId(userId);
      stubCurrentUserId(userId);
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

  describe('visibility column', () => {
    beforeEach(() => {
      sandbox.stub(window, 'fetch').resolves(mockCeteraFetchResponse);
      // Hack to shush console.error from failed catalog-service (fka cetera) query
      sandbox.stub(console, 'error');
      wrapper = mount(<UserProfile {...userProfileProps()} />);
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('when currentUser has a role and admin flag', () => {
      before(() => {
        stubVisibility({ hasRole: true, hasAdminFlag: true });
      });

      it('should be present', () => {
        assert.exists(window.socrata.currentUser.roleId);
        assert.include(window.socrata.currentUser.flags, 'admin');
        assert.equal(wrapper.find('th.visibility').length, 1);
      });
    });

    describe('when currentUser has a role but no admin flag', () => {
      before(() => {
        stubVisibility({ hasRole: true, hasAdminFlag: false });
      });

      it('should be present', () => {
        assert.exists(window.socrata.currentUser.roleId);
        assert.notInclude(window.socrata.currentUser.flags, 'admin');
        assert.equal(wrapper.find('th.visibility').length, 1);
      });
    });

    describe('when currentUser has no role but has admin flag', () => {
      before(() => {
        stubVisibility({ hasRole: false, hasAdminFlag: true });
      });

      it('should be present', () => {
        assert.notExists(window.socrata.currentUser.roleId);
        assert.include(window.socrata.currentUser.flags, 'admin');
        assert.equal(wrapper.find('th.visibility').length, 1);
      });
    });

    describe('when currentUser has no role and no admin flag', () => {
      before(() => {
        stubVisibility({ hasRole: false, hasAdminFlag: false });
      });

      it('should not be present', () => {
        assert.notExists(window.socrata.currentUser.roleId);
        assert.notInclude(window.socrata.currentUser.flags, 'admin');
        assert.equal(wrapper.find('th.visibility').length, 0);
      });
    });
  });
});
