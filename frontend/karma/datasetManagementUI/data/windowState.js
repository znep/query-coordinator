export default {
  view: {
    id: 'ww72-hpm3',
    name: 'jk',
    averageRating: 0,
    createdAt: 1497379393,
    displayType: 'draft',
    domainCName: 'localhost',
    downloadCount: 0,
    hideFromCatalog: false,
    hideFromDataJson: false,
    newBackend: false,
    numberOfComments: 0,
    oid: 585,
    provenance: 'official',
    publicationAppendEnabled: false,
    publicationGroup: 582,
    publicationStage: 'unpublished',
    rowsUpdatedAt: 1497379393,
    tableId: 582,
    totalTimesRated: 0,
    viewCount: 0,
    viewLastModified: 1497379468,
    viewType: 'tabular',
    columns: [],
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
        'view_story'
      ],
      flags: ['admin']
    },
    query: {},
    rights: [
      'read',
      'write',
      'add',
      'delete',
      'grant',
      'add_column',
      'remove_column',
      'update_column',
      'update_view',
      'delete_view'
    ],
    tableAuthor: {
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
        'view_story'
      ],
      flags: ['admin']
    },
    flags: ['default']
  },
  revision: {
    task_sets: [],
    revision_seq: 0,
    metadata: null,
    id: 172,
    fourfour: 'ww72-hpm3',
    created_by: {
      user_id: 'tugg-ikce',
      email: 'brandon.webster@socrata.com',
      display_name: 'branweb'
    },
    created_at: '2017-06-13T18:43:14.056625',
    closed_at: null,
    action: {
      type: 'replace',
      schema: null
    },
    uploads: [
      {
        schemas: [
          {
            total_rows: 3,
            output_schemas: [
              {
                output_columns: [
                  {
                    transform: {
                      transform_input_columns: [
                        {
                          input_column_id: 1773
                        }
                      ],
                      transform_expr: '`foo`',
                      output_soql_type: 'text',
                      id: 1800,
                      failed_at: null,
                      completed_at: '2017-06-13T18:43:32',
                      attempts: 0
                    },
                    position: 0,
                    is_primary_key: false,
                    id: 1805,
                    field_name: 'foo',
                    display_name: 'foo',
                    description: ''
                  },
                  {
                    transform: {
                      transform_input_columns: [
                        {
                          input_column_id: 1774
                        }
                      ],
                      transform_expr: '`bar`',
                      output_soql_type: 'text',
                      id: 1801,
                      failed_at: null,
                      completed_at: '2017-06-13T18:43:32',
                      attempts: 0
                    },
                    position: 1,
                    is_primary_key: false,
                    id: 1806,
                    field_name: 'bar',
                    display_name: 'bar',
                    description: ''
                  }
                ],
                input_schema_id: 91,
                id: 127,
                error_count: 1,
                created_by: {
                  user_id: 'tugg-ikce',
                  email: 'brandon.webster@socrata.com',
                  display_name: 'branweb'
                },
                created_at: '2017-06-13T18:43:32.033034',
                completed_at: '2017-06-13T18:43:32'
              }
            ],
            name: null,
            input_columns: [
              {
                soql_type: 'text',
                position: 1,
                input_schema_id: 91,
                id: 1774,
                guessed_subtypes: [],
                guessed_soql_type: 'text',
                field_name: 'bar'
              },
              {
                soql_type: 'text',
                position: 0,
                input_schema_id: 91,
                id: 1773,
                guessed_subtypes: [],
                guessed_soql_type: 'text',
                field_name: 'foo'
              }
            ],
            id: 91,
            created_by: {
              user_id: 'tugg-ikce',
              email: 'brandon.webster@socrata.com',
              display_name: 'branweb'
            },
            created_at: '2017-06-13T18:43:31.918460'
          }
        ],
        id: 108,
        header_count: 1,
        finished_at: '2017-06-13T18:43:32',
        filename: 'tiny-errors.csv',
        failed_at: null,
        created_by: {
          user_id: 'tugg-ikce',
          email: 'brandon.webster@socrata.com',
          display_name: 'branweb'
        },
        created_at: '2017-06-13T18:43:31.586356',
        content_type: 'text/csv',
        column_header: 1
      }
    ]
  },
  datasetCategories: [
    {
      title: '-- No category --',
      value: ''
    },
    {
      title: 'Business',
      value: 'Business'
    },
    {
      title: 'Education',
      value: 'Education'
    },
    {
      title: 'Fun',
      value: 'Fun'
    },
    {
      title: 'Government',
      value: 'Government'
    },
    {
      title: 'Illegal',
      value: 'Illegal'
    },
    {
      title: 'Personal',
      value: 'Personal'
    }
  ],
  datasetLicenses: [
    {
      title: '-- No License --',
      value: ''
    },
    {
      title: 'Canada Open Government Licence',
      value: 'OGL_CANADA'
    },
    {
      title: 'Creative Commons 1.0 Universal (Public Domain Dedication)',
      value: 'CC0_10'
    },
    {
      title: 'Creative Commons Attribution 3.0 Australia',
      value: 'CC_30_BY_AUS'
    },
    {
      title: 'Creative Commons Attribution 3.0 IGO',
      value: 'CC_30_BY_IGO'
    },
    {
      title: 'Creative Commons Attribution 3.0 New Zealand',
      value: 'CC_30_BY_NZ'
    },
    {
      title: 'Creative Commons Attribution 3.0 Unported',
      value: 'CC_30_BY'
    },
    {
      title: 'Creative Commons Attribution 4.0 International',
      value: 'CC_40_BY'
    },
    {
      title: 'Creative Commons Attribution | No Derivative Works 3.0 Unported',
      value: 'CC_30_BY_ND'
    },
    {
      title:
        'Creative Commons Attribution | NoDerivatives 4.0 International License',
      value: 'CC_40_BY_ND'
    },
    {
      title: 'Creative Commons Attribution | Noncommercial 3.0 New Zealand',
      value: 'CC_30_BY_NC_NZ'
    },
    {
      title: 'Creative Commons Attribution | Noncommercial 3.0 Unported',
      value: 'CC_30_BY_NC'
    },
    {
      title:
        'Creative Commons Attribution | Noncommercial | No Derivative Works 3.0 IGO',
      value: 'CC_30_BY_NC_ND_IGO'
    },
    {
      title:
        'Creative Commons Attribution | Noncommercial | No Derivative Works 3.0 Unported',
      value: 'CC_30_BY_NC_ND'
    },
    {
      title:
        'Creative Commons Attribution | Noncommercial | Share Alike 3.0 New Zealand',
      value: 'CC_30_BY_NC_SA_NZ'
    },
    {
      title:
        'Creative Commons Attribution | Noncommercial | Share Alike 3.0 Unported',
      value: 'CC_30_BY_NC_SA'
    },
    {
      title: 'Creative Commons Attribution | Share Alike 3.0 Unported',
      value: 'CC_30_BY_SA'
    },
    {
      title: 'Creative Commons Attribution | Share Alike 4.0 International',
      value: 'CC_40_BY_SA'
    },
    {
      title: 'Italian Open Data License 2.0',
      value: 'IODL'
    },
    {
      title: 'Nova Scotia Open Government Licence',
      value: 'OGL_NOVA_SCOTIA'
    },
    {
      title: 'Open Data Commons Attribution License',
      value: 'ODC_BY'
    },
    {
      title: 'Open Data Commons Open Database License',
      value: 'ODBL'
    },
    {
      title: 'Open Data Commons Public Domain Dedication and License',
      value: 'PDDL'
    },
    {
      title: 'Public Domain',
      value: 'PUBLIC_DOMAIN'
    },
    {
      title: 'Public Domain U.S. Government',
      value: 'USGOV_WORKS'
    },
    {
      title: 'See Terms of Use',
      value: 'SEE_TERMS_OF_USE'
    },
    {
      title: 'Standard Reference Data Copyright U.S. Secretary of Commerce',
      value: 'NIST_SRD'
    },
    {
      title: 'UK Open Government Licence v3',
      value: 'UK_OGLV3.0'
    }
  ],
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
          required: false
        },
        {
          private: true,
          name: 'thing',
          required: false
        }
      ]
    },
    {
      name: 'wuttt',
      fields: [
        {
          private: true,
          name: 'hay',
          required: false
        }
      ]
    }
  ]
};
