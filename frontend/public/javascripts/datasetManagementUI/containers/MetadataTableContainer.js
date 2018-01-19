import { connect } from 'react-redux';
import _ from 'lodash';
import { withRouter, browserHistory } from 'react-router';
import MetadataTable from 'datasetManagementUI/components/MetadataTable/MetadataTable';
import { associateChildToParent } from 'datasetManagementUI/reduxStuff/actions/associateCollections';
import { UPDATE_REVISION } from 'datasetManagementUI/reduxStuff/actions/apiCalls';
import { FeatureFlags } from 'common/feature_flags';
import * as Links from 'datasetManagementUI/links/links';

export const getRevision = (rSeq, revisions) =>
  _.chain(revisions)
    .find({ revision_seq: rSeq })
    .value();

export const getView = (fourfour, views) =>
  _.chain(views)
    .get(fourfour)
    .value();

// shapeRevisionForProps :: Revision -> ViewlikeObj
const shapeRevisionForProps = revision => ({
  name: revision.metadata.name,
  description: revision.metadata.description,
  category: revision.metadata.category,
  tags: revision.metadata.tags,
  attribution: revision.metadata.attribution,
  attributionLink: revision.metadata.attributionLink || '',
  license: revision.metadata.license,
  createdAt: Math.floor(revision.created_at.getTime() / 1000),
  // TODO Not sure about this - is the revision author effectively the owner?
  owner: {
    displayName: revision.created_by.display_name,
    id: revision.created_by.user_id
  },
  metadata: {
    ...revision.metadata.metadata,
    attachments: revision.attachments.map(a => ({ ...a, assetId: a.asset_id }))
  },
  privateMetadata: {
    ...revision.metadata.privateMetadata
  }
});

// MetadataTable component doesn't distinguish between private and non-private
// custom metadata. So we have to do some data-massaging here before passing
// custom metadata info to it.
export const shapeCustomMetadata = (viewlikeObj = {}, customFieldsets = []) => {
  const privateCustomMetadata = _.get(viewlikeObj, 'privateMetadata.custom_fields', {});
  const nonPrivateCustomMetadata = _.get(viewlikeObj, 'metadata.custom_fields', {});
  const combinedCustomMetadata = _.merge(nonPrivateCustomMetadata, privateCustomMetadata);
  const currentAvailableFields = customFieldsets.map(fieldset => fieldset.name);
  // Necessary in case user deletes a field but we still have data for it.
  return _.pickBy(combinedCustomMetadata, (v, k) => currentAvailableFields.includes(k));
};

export const makeProps = (entities, params) => {
  const rSeq = _.toNumber(params.revisionSeq);

  const r = getRevision(rSeq, entities.revisions);
  const v = getView(params.fourfour, entities.views);

  const emptyProps = {
    view: {},
    customMetadataFieldsets: {},
    onClickEditMetadata: _.noop
  };

  if (!r || !v) {
    return emptyProps;
  } else {
    let customMetadataFieldsets = {};

    const viewlikeObj = {
      ...v,
      ...shapeRevisionForProps(r)
    };

    if (viewlikeObj.metadata && viewlikeObj.customMetadataFieldsets) {
      customMetadataFieldsets = shapeCustomMetadata(viewlikeObj, viewlikeObj.customMetadataFieldsets);
    }

    const isUSAID = FeatureFlags.value('usaid_features_enabled');
    const enableAssociatedAssets = isUSAID && r.is_parent === false;
    const useDataAssetStrings = isUSAID && r.is_parent === true;

    return {
      editMetadataUrl: isUSAID ? `/publisher/edit?view=${r.fourfour}` : '#',
      enableAssociatedAssets,
      statsUrl: null,
      disableContactDatasetOwner: true, // looks up a CurrentDomain feature whatever that is
      coreView: viewlikeObj,
      customMetadataFieldsets,
      onClickEditMetadata: e => {
        if (!isUSAID) {
          e.preventDefault();
          browserHistory.push(Links.metadata(params));
        }
      },
      revision: r,
      useDataAssetStrings
    };
  }
};

function mergeProps(stateProps, { dispatch }, ownProps) {
  return {
    ...ownProps,
    ...stateProps,
    onSaveAssociationCallback: parentUid =>
      dispatch(associateChildToParent(parentUid, stateProps.revision, ownProps.params))
  };
}

const mapStateToProps = ({ entities, ui }, { params }) => ({
  associatedAssetsApiCalls: _.filter(_.values(ui.apiCalls), call => call.operation === UPDATE_REVISION),
  ...makeProps(entities, params)
});

export default withRouter(connect(mapStateToProps, null, mergeProps)(MetadataTable));
