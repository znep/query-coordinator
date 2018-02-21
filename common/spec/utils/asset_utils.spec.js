import { assert } from 'chai';
import * as assetUtils from 'common/asset/utils';
import * as assetUtilsHelpers from 'common/asset/utils/helpers';
import * as constants from 'common/components/AssetBrowser/lib/constants';
import mockView from '../data/mockView';
import { FeatureFlags } from 'common/feature_flags';

describe('asset/utils', () => {
  let coreView;

  beforeEach(() => {

    coreView = Object.assign({}, mockView);

    coreView.approvals = [
      {
        notes: '',
        outcome: 'publicize',
        state: 'pending',
        submittedAt: 1518810288,
        workflowId: 3,
        submitter: {
          id: '7kqb-5s8x',
          displayName: 'Dylan',
          email: 'dylan.bussone@socrata.com'
        }
      }
    ];

    coreView.publishedViewUid = null;

    FeatureFlags.useTestFixture({ use_fontana_approvals: true });
  });

  describe('assetWillEnterApprovalsQueueOnPublish', () => {
    it('returns false if use_fontana_approvals is not enabled', (done) => {
      FeatureFlags.useTestFixture({ use_fontana_approvals: false });
      assetUtils.assetWillEnterApprovalsQueueOnPublish({ coreView }).then((result) => {
        assert.isFalse(result);
        done();
      });
    });

    it('returns false if the asset is auto-approved', (done) => {
      coreView.approvals[0].state = constants.APPROVAL_STATUS_APPROVED;
      assetUtils.assetWillEnterApprovalsQueueOnPublish({ coreView }).then((result) => {
        assert.isFalse(result);
        done();
      });
    });

    it('returns false if the current user has no rights', (done) => {
      window.socrata.currentUser = { rights: [] };

      assetUtils.assetWillEnterApprovalsQueueOnPublish({ coreView }).then((result) => {
        assert.isFalse(result);
        done();
      });
    });

    it('returns false if the asset is private', (done) => {
      coreView.grants = [{ flags: [] }];

      assetUtils.assetWillEnterApprovalsQueueOnPublish({ coreView }).then((result) => {
        assert.isFalse(result);
        done();
      });
    });

    it('returns false if the asset type is set to auto approve', (done) => {
      coreView.provenance = constants.AUTHORITY_OFFICIAL;
      window.socrata.approvals = { settings: { official: constants.APPROVAL_SETTINGS_AUTOMATIC } };

      assetUtils.assetWillEnterApprovalsQueueOnPublish({ coreView }).then((result) => {
        assert.isFalse(result);
        done();
      });
    });

    it('returns true if all conditions are met', (done) => {
      coreView.approvals[0].state = 'pending';
      coreView.provenance = constants.AUTHORITY_OFFICIAL;
      coreView.grants = [{ flags: ['public'] }];
      window.socrata.approvals = { settings: { official: constants.APPROVAL_SETTINGS_MANUAL } };
      window.socrata.currentUser = { rights: ['see_approval_required_on_publish'] };

      assetUtils.assetWillEnterApprovalsQueueOnPublish({ coreView }).then((result) => {
        assert.isTrue(result);
        done();
      });
    });
  });

  describe('assetWillEnterApprovalsQueueWhenMadePublic', () => {
    it('returns false if use_fontana_approvals is not enabled', (done) => {
      FeatureFlags.useTestFixture({ use_fontana_approvals: false });
      assetUtils.assetWillEnterApprovalsQueueWhenMadePublic({ coreView }).then((result) => {
        assert.isFalse(result);
        done();
      });
    });

    it('returns false if the asset is auto-approved', (done) => {
      coreView.approvals[0].state = constants.APPROVAL_STATUS_APPROVED;
      assetUtils.assetWillEnterApprovalsQueueWhenMadePublic({ coreView }).then((result) => {
        assert.isFalse(result);
        done();
      });
    });

    it('returns false if the current user has no rights', (done) => {
      window.socrata.currentUser = { rights: [] };

      assetUtils.assetWillEnterApprovalsQueueWhenMadePublic({ coreView }).then((result) => {
        assert.isFalse(result);
        done();
      });
    });

    it('returns false if the asset type is set to auto approve', (done) => {
      coreView.provenance = constants.AUTHORITY_OFFICIAL;
      window.socrata.approvals = { settings: { official: constants.APPROVAL_SETTINGS_AUTOMATIC } };

      assetUtils.assetWillEnterApprovalsQueueWhenMadePublic({ coreView }).then((result) => {
        assert.isFalse(result);
        done();
      });
    });

    it('returns true if all conditions are met', (done) => {
      coreView.approvals[0].state = 'pending';
      coreView.provenance = constants.AUTHORITY_OFFICIAL;
      window.socrata.approvals = { settings: { official: constants.APPROVAL_SETTINGS_MANUAL } };
      window.socrata.currentUser = { rights: ['see_approval_required_on_publish'] };

      assetUtils.assetWillEnterApprovalsQueueWhenMadePublic({ coreView }).then((result) => {
        assert.isTrue(result);
        done();
      });
    });
  });

  describe('helpers', () => {

    describe('manualApprovalRequiredForProvenanceType', () => {
      it('returns false when there is no approvals config', () => {
        window.socrata.approvals = { settings: {} };
        coreView.provenance = constants.AUTHORITY_OFFICIAL;
        assert.isFalse(assetUtilsHelpers.manualApprovalRequiredForProvenanceType(coreView));
      });

      it('returns false when the approvals config is set to automatic for the provenance type', () => {
        window.socrata.approvals = { settings: { community: constants.APPROVAL_SETTINGS_AUTOMATIC } };
        coreView.provenance = constants.AUTHORITY_COMMUNITY;
        assert.isFalse(assetUtilsHelpers.manualApprovalRequiredForProvenanceType(coreView));
      });

      it('returns true when the approvals config is set to manual for the provenance type', () => {
        window.socrata.approvals = { settings: { community: constants.APPROVAL_SETTINGS_MANUAL } };
        coreView.provenance = constants.AUTHORITY_COMMUNITY;
        assert.isTrue(assetUtilsHelpers.manualApprovalRequiredForProvenanceType(coreView));
      });

    });

    describe('assetIsPending', () => {
      it('returns true when the state is pending', () => {
        coreView.approvals[0].state = 'pending';
        assert.isTrue(assetUtilsHelpers.assetIsPending(coreView));
      });
    });

    describe('assetIsApproved', () => {
      it('returns true when the state is approved', () => {
        coreView.approvals[0].state = constants.APPROVAL_STATUS_APPROVED;
        assert.isTrue(assetUtilsHelpers.assetIsApproved(coreView));
      });
    });

    describe('assetIsRejected', () => {
      it('returns true when the state is rejected', () => {
        coreView.approvals[0].state = constants.APPROVAL_STATUS_REJECTED;
        assert.isTrue(assetUtilsHelpers.assetIsRejected(coreView));
      });
    });

  });

});
