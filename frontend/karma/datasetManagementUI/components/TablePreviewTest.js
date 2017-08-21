import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import TablePreview from 'components/TablePreview/TablePreview';

describe.only('components/TablePreview', () => {
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
      sources: {},
      input_schemas: {},
      input_columns: {},
      output_schemas: {},
      output_columns: {},
      output_schema_columns: {},
      transforms: {},
      task_sets: {},
      email_interests: {},
      row_errors: {},
      col_data: {}
    },

    createUpload: '[function createUpload]'
  };

  // it('renders "manage data" button', () => {
  //   const component = shallow(<TablePreview {...defaultProps} />);
  //   assert.isFalse(component.find('.manageDataBtn').isEmpty());
  // });

  it('renders list of accepted file types', () => {
    const component = shallow(<TablePreview {...defaultProps} />);
    console.log(component.debug());
    // const clonedProps = _.cloneDeep(ShowRevisionProps);
    // clonedProps.entities.output_schemas = {};
    // clonedProps.entities.input_schemas = {};
    // clonedProps.entities.sources = {};
    // clonedProps.entities.task_sets = {};
    //
    // const theComponent = shallow(<ShowRevision {...clonedProps} />);
    // assert.equal(
    //   theComponent
    //     .find('WrapDataTablePlaceholder')
    //     .dive()
    //     .find('.fileTypes')
    //     .text(),
    //   'Supported file types: .csv, .tsv, .xls, .xlsx'
    // );
  });
});
