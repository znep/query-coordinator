import { assert } from 'chai';
import {
  getRevision,
  getView,
  shapeCustomMetadata
} from 'models/metadataTable';

describe('models/metadataTable', () => {
  describe('getRevision', () => {
    const revision = {
      id: 334,
      revision_seq: 0
    };

    const revisions = {
      '334': revision
    };

    it('fetches a revision from the store using revision sequence number', () => {
      const r = getRevision(0, revisions);
      assert.deepEqual(r, revision);
    });

    it('returns undefined if no revision exists with the specified sequence number', () => {
      const r = getRevision(22, revisions);
      assert.isUndefined(r);
    });
  });

  describe('getView', () => {
    const view = {
      id: '5bcc-hb4q',
      name: 'my cool view'
    };

    const views = {
      '5bcc-hb4q': view
    };

    it('fetches a view from the store using fourfour', () => {
      const v = getView('5bcc-hb4q', views);
      assert.deepEqual(v, view);
    });

    it('returns undefined if no view exists with the specified fourfour', () => {
      const v = getRevision('abcd-1234', views);
      assert.isUndefined(v);
    });
  });

  describe('shapeCustomMetadata', () => {
    // corresponds to the metadata field on the revision
    const metadata = {
      privateMetadata: {
        custom_fields: {
          secretFieldset: {
            secretField: 'whoa so private'
          }
        }
      },
      metadata: {
        custom_fields: {
          regularFieldset: {
            regular: 'eh not that private'
          }
        }
      }
    };

    // corresponds to the custom fieldsets on the view
    const customFieldsets = [
      {
        name: 'secretFieldset',
        fields: [
          {
            name: 'secretField'
          }
        ]
      },
      {
        name: 'regularFieldset',
        fields: [
          {
            name: 'regular'
          }
        ]
      }
    ];

    it('merges private and non-private custom fields', () => {
      const mergedFieldsets = shapeCustomMetadata(metadata, customFieldsets);

      assert.deepEqual(mergedFieldsets, {
        regularFieldset: { regular: 'eh not that private' },
        secretFieldset: { secretField: 'whoa so private' }
      });
    });
  });
});
