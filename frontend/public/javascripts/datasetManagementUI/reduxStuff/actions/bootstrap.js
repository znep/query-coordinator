import _ from 'lodash';

export const BOOTSTRAP_APP = 'BOOTSTRAP_APP';
export const bootstrapApp = (view, customMetadataFieldsets) => {
  const initialView = {
    // TODO: Can we send the entire view unmodified?
    id: view.id,
    name: view.name,
    description: view.description,
    category: view.category,
    owner: view.owner,
    viewLastModified: view.viewLastModified,
    rowsUpdatedAt: view.rowsUpdatedAt,
    createdAt: view.createdAt,
    viewCount: view.viewCount,
    downloadCount: view.downloadCount,
    license: view.license || {},
    licenseId: view.licenseId,
    attribution: view.attribution,
    attributionLink: view.attributionLink,
    tags: view.tags || [],
    privateMetadata: view.privateMetadata || {},
    attachments: _.get(view, 'metadata.attachments', []),
    metadata: view.metadata || {},
    customMetadataFieldsets
  };

  return {
    type: BOOTSTRAP_APP,
    initialView
  };
};
