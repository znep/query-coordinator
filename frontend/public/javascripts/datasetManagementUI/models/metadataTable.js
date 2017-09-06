import _ from 'lodash';
import { browserHistory } from 'react-router';
import * as Links from 'links';

export const getRevision = (rSeq, revisions) => _.chain(revisions).find({ revision_seq: rSeq }).value();

export const getView = (fourfour, views) => _.chain(views).get(fourfour).value();

// shapeRevisionForProps :: Revision -> ViewlikeObj
const shapeRevisionForProps = revision => ({
  tags: revision.metadata.tags,
  attribution: revision.metadata.attribution,
  attributionLink: revision.metadata.attributionLink || '',
  attachments: revision.metadata.attachments, // MetadataTable transforms this
  license: revision.metadata.license,
  createdAt: Math.floor(revision.created_at.getTime() / 1000),
  // TODO Not sure about this - is the revision author effectively the owner?
  owner: {
    displayName: revision.created_by.display_name,
    id: revision.created_by.user_id

  },
  metadata: revision.metadata
});

// MetadataTable component doesn't distinguish between private and non-private
// custom metadata. So we have to do some data-massaging here before passing
// custom metadata info to it.
export const shapeCustomMetadata = (metadata = {}, customFieldsets = []) => {
  const privateCustomMetadata = _.get(metadata, 'privateMetadata.custom_fields', {});
  const nonPrivateCustomMetadata = _.get(metadata, 'metadata.custom_fields', {});
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
      customMetadataFieldsets = shapeCustomMetadata(
        viewlikeObj.metadata,
        viewlikeObj.customMetadataFieldsets
      );
    }

    return {
      editMetadataUrl: '#',
      statsUrl: null,
      disableContactDatasetOwner: true, // looks up a CurrentDomain feature whatever that is
      coreView: viewlikeObj,
      customMetadataFieldsets,
      onClickEditMetadata: e => {
        e.preventDefault();
        browserHistory.push(Links.metadata(params));
      }
    };
  }
};
