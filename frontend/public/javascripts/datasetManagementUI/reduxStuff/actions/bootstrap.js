import _ from 'lodash';

export const BOOTSTRAP_APP = 'BOOTSTRAP_APP';
export const bootstrapApp = (view, customMetadataFieldsets) => {
  const millis = 1000;

  const initialView = {
    id: view.id,
    name: view.name,
    description: view.description,
    category: view.category,
    owner: view.owner,
    lastUpdatedAt: new Date(view.viewLastModified * millis), // TODO: not sure about this one
    dataLastUpdatedAt: new Date(view.rowsUpdatedAt * millis),
    metadataLastUpdatedAt: new Date(view.viewLastModified * millis),
    createdAt: new Date(view.createdAt * millis),
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
