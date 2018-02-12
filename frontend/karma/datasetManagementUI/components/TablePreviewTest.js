import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import TablePreview from 'datasetManagementUI/components/TablePreview/TablePreview';
import dotProp from 'dot-prop-immutable';

describe('components/TablePreview', () => {
  const defaultProps = {
    params: {
      category: 'dataset',
      name: 'ok',
      fourfour: 'm6u6-r357',
      revisionSeq: '0'
    },
    view: {
      id: 'm6u6-r357',
      name: 'ok',
      displayType: 'draft',
      owner: {},
      lastUpdatedAt: {},
      dataLastUpdatedAt: {},
      metadataLastUpdatedAt: {},
      createdAt: {},
      viewCount: 0,
      downloadCount: 0,
      license: {},
      tags: {},
      privateMetadata: {},
      attachments: {},
      metadata: {},
      customMetadataFieldsets: {}
    },
    entities: {
      views: {
        'm6u6-r357': {
          id: 'm6u6-r357',
          name: 'ok',
          displayType: 'draft',
          owner: {
            id: 'tugg-ikce',
            displayName: 'branweb',
            emailUnsubscribed: false,
            profileLastModified: 1488413060,
            screenName: 'branweb',
            rights: [
              'create_datasets',
              'edit_others_datasets',
              'edit_sdp',
              'edit_site_theme',
              'moderate_comments',
              'manage_users',
              'chown_datasets',
              'edit_nominations',
              'approve_nominations',
              'feature_items',
              'federations',
              'manage_stories',
              'manage_approval',
              'change_configurations',
              'view_domain',
              'view_others_datasets',
              'create_pages',
              'edit_pages',
              'view_goals',
              'view_dashboards',
              'edit_goals',
              'edit_dashboards',
              'create_dashboards',
              'manage_provenance',
              'view_all_dataset_status_logs',
              'use_data_connectors',
              'create_story',
              'edit_story_title_desc',
              'create_story_copy',
              'delete_story',
              'manage_story_collaborators',
              'manage_story_visibility',
              'manage_story_public_version',
              'edit_story',
              'view_unpublished_story',
              'view_story',
              'edit_others_stories',
              'view_stories_stats'
            ],
            flags: ['admin']
          },
          lastUpdatedAt: '2017-08-21T19:43:29.000Z',
          dataLastUpdatedAt: '2017-08-21T19:43:29.000Z',
          metadataLastUpdatedAt: '2017-08-21T19:43:29.000Z',
          createdAt: '2017-08-21T19:43:29.000Z',
          viewCount: 0,
          downloadCount: 0,
          license: {},
          tags: [],
          privateMetadata: {},
          attachments: [],
          metadata: {},
          customMetadataFieldsets: [
            {
              name: 'FS One',
              fields: [
                {
                  name: 'name',
                  required: false
                },
                {
                  name: 'animals',
                  options: ['dog', 'cat', 'pig', 'sheep'],
                  type: 'fixed',
                  required: true
                },
                {
                  private: true,
                  name: 'thing',
                  required: false
                }
              ]
            },
            {
              name: 'Another Fieldset -Long name with some hypens',
              fields: [
                {
                  private: true,
                  name:
                    'Hey I suck and like to create - long - weird fieldnames',
                  required: false
                },
                {
                  name: 'why ?? -- why - (y/n)',
                  required: true
                }
              ]
            },
            {
              name: 'nofields'
            }
          ]
        }
      },
      revisions: {
        '350': {
          id: 350,
          fourfour: 'm6u6-r357',
          href: [],
          metadata: {
            tags: null,
            privateMetadata: {},
            name: 'ok',
            metadata: {},
            licenseId: null,
            license: {},
            description: null,
            category: null,
            attributionLink: null,
            attribution: null
          },
          output_schema_id: null,
          permission: 'public',
          task_sets: [],
          revision_seq: 0,
          created_at: '2017-08-21T19:43:29.966Z',
          created_by: {
            user_id: 'tugg-ikce',
            email: 'brandon.webster@socrata.com',
            display_name: 'branweb'
          }
        }
      },
      sources: {
        '100': { id: 100 }
      },
      input_schemas: {
        '1': {
          id: 1,
          source_id: 100
        }
      },
      input_columns: {},
      output_schemas: {
        '10': {
          id: 10,
          input_schema_id: 1
        }
      },
      output_columns: {},
      output_schema_columns: {},
      transforms: {},
      task_sets: {},
      email_interests: {},
      row_errors: {},
      col_data: {}
    }
  };

  it('renders a link to the source page', () => {
    const component = shallow(<TablePreview {...defaultProps} />);
    const link = component
      .find('NoDataYetView')
      .dive()
      .find('Link');

    assert.isTrue(link.exists());
    assert.equal(link.prop('to'), '/dataset/ok/m6u6-r357/revisions/0/sources');
  });

  it('renders a link to the schema page when schema available', () => {
    const newProps = dotProp.set(defaultProps, 'entities.revisions.350.output_schema_id', 10);
    const component = shallow(<TablePreview {...newProps} />);
    const link = component
      .find('PreviewDataView')
      .dive()
      .find('Link');
    assert.isTrue(link.at(1).exists());
    assert.equal(link.at(1).prop('to'), '/dataset/ok/m6u6-r357/revisions/0/sources/100/schemas/1/output/10');
  });

  it('renders a link to the blob page when blob available', () => {
    const newProps = dotProp.set(defaultProps, 'entities.revisions.350.blob_id', 100);
    const component = shallow(<TablePreview {...newProps} />);
    const link = component
      .find('PreviewDataView')
      .dive()
      .find('Link');

    assert.isTrue(link.at(1).exists());
    assert.equal(link.at(1).prop('to'), '/dataset/ok/m6u6-r357/revisions/0/sources/100/preview');
  });
});
