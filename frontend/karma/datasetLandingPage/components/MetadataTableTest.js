import { assert } from 'chai';

import { FeatureFlags } from 'common/feature_flags';

import { mapStateToProps } from 'datasetLandingPage/components/MetadataTable';

const coreView = {
  id: '5bcc-hb4q',
  name: 'hj',
  description: null,
  category: null,
  owner: {},
  viewCount: 0,
  downloadCount: 0,
  license: {},
  licenseId: 'CC_30_BY_NZ',
  attribution: null,
  attributionLink: '',
  tags: null,
  metadata: {},
  editMetadataUrl: '#',
  ownerName: 'branweb'
};

const defaultFeatureFlags = {
  enable_user_notifications: true,
  enable_alert_notifications_for_all_users: true,
  enable_alert_notifications_for_admin_users: true,
  enable_alert_notifications_for_role_users: true,
  usaid_features_enabled: false
};

// TODO: This needs tests! EN-21057
describe('components/MetadataTable mapStateToProps', () => {
  beforeEach(() => {
    FeatureFlags.useTestFixture(defaultFeatureFlags);
  });

  describe('USAID workarounds', () => {
    beforeEach(() => {
      FeatureFlags.useTestFixture(_.extend({}, defaultFeatureFlags, {
        usaid_features_enabled: true
      }));
    });

    it('sets useDataAssetStrings to true only if coreView.isParent', () => {
      const isParent = _.extend({}, coreView, { metadata: { isParent: true } });
      const notParent = _.extend({}, coreView, { metadata: { isParent: false } });

      assert.propertyVal(
        mapStateToProps({ view: { coreView } }), // isParent not set
        'useDataAssetStrings',
        false
      );

      assert.propertyVal(
        mapStateToProps({ view: { coreView: isParent } }),
        'useDataAssetStrings',
        true
      );

      assert.propertyVal(
        mapStateToProps({ view: { coreView: notParent } }),
        'useDataAssetStrings',
        false
      );
    });
  });

  it('does not crash if metadata is not set', () => {
    const noMetadata = _.omit(coreView, 'metadata');
    assert.doesNotThrow(() => {
      mapStateToProps({
        view: { coreView: noMetadata }
      })
    });
  });
});
