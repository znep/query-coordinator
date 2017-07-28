const initialState = {
  entities: {
    views: {
      'kg5j-unyr': {
        id: 'kg5j-unyr',
        name: 'omgwtf',
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
        lastUpdatedAt: new Date(1497400577000),
        dataLastUpdatedAt: new Date(1497400577000),
        metadataLastUpdatedAt: new Date(1497400577000),
        createdAt: new Date(1497400577000),
        viewCount: 0,
        downloadCount: 0,
        license: {},
        schema: {
          isValid: true,
          fields: {
            name: {
              isValid: true,
              required: true,
              errors: []
            }
          }
        },
        tags: [],
        privateMetadata: {},
        attachments: [],
        metadata: {},
        customMetadataFields: [
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
        ],
        colFormModel: {
          'display-name-1945': 'IDd\\',
          'description-1945': '',
          'field-name-1945': 'id',
          'display-name-1946': 'Case Number',
          'description-1946': '',
          'field-name-1946': 'case_number',
          'display-name-1947': 'Date',
          'description-1947': '',
          'field-name-1947': 'date',
          'display-name-1948': 'Block',
          'description-1948': '',
          'field-name-1948': 'block',
          'display-name-1949': 'IUCR',
          'description-1949': '',
          'field-name-1949': 'iucr',
          'display-name-1950': 'Primary Type',
          'description-1950': '',
          'field-name-1950': 'primary_type',
          'display-name-1951': 'Description',
          'description-1951': '',
          'field-name-1951': 'description',
          'display-name-1952': 'Location Description',
          'description-1952': '',
          'field-name-1952': 'location_description',
          'display-name-1953': 'Arrest',
          'description-1953': '',
          'field-name-1953': 'arrest',
          'display-name-1954': 'Domestic',
          'description-1954': '',
          'field-name-1954': 'domestic',
          'display-name-1955': 'Beat',
          'description-1955': '',
          'field-name-1955': 'beat',
          'display-name-1956': 'District',
          'description-1956': '',
          'field-name-1956': 'district',
          'display-name-1957': 'Ward',
          'description-1957': '',
          'field-name-1957': 'ward',
          'display-name-1958': 'Community Area',
          'description-1958': '',
          'field-name-1958': 'community_area',
          'display-name-1959': 'FBI Code',
          'description-1959': '',
          'field-name-1959': 'fbi_code',
          'display-name-1960': 'X Coordinate',
          'description-1960': '',
          'field-name-1960': 'x_coordinate',
          'display-name-1961': 'Y Coordinate',
          'description-1961': '',
          'field-name-1961': 'y_coordinate',
          'display-name-1962': 'Year',
          'description-1962': '',
          'field-name-1962': 'year',
          'display-name-1963': 'Updated On',
          'description-1963': '',
          'field-name-1963': 'updated_on',
          'display-name-1964': 'Latitude',
          'description-1964': '',
          'field-name-1964': 'latitude',
          'display-name-1965': 'Longitude',
          'description-1965': '',
          'field-name-1965': 'longitude',
          'display-name-1966': 'Location',
          'description-1966': '',
          'field-name-1966': 'location'
        },
        colFormIsDirty: {
          fields: ['display-name-1945'],
          form: true
        }
      }
    },
    revisions: {
      '179': {
        id: 179,
        fourfour: 'kg5j-unyr',
        task_sets: [],
        revision_seq: 0,
        created_at: new Date(1497400578745),
        created_by: {
          user_id: 'tugg-ikce',
          email: 'brandon.webster@socrata.com',
          display_name: 'branweb'
        }
      }
    },
    sources: {
      '115': {
        id: 115,
        header_count: 1,
        finished_at: new Date(1497400641000),
        source_type: {
          type: 'upload',
          filename: 'petty_crimes.csv'
        },
        failed_at: null,
        created_by: {
          user_id: 'tugg-ikce',
          email: 'brandon.webster@socrata.com',
          display_name: 'branweb'
        },
        created_at: new Date(1497400636545),
        content_type: 'text/csv',
        column_header: 1
      }
    },
    input_schemas: {
      '98': {
        id: 98,
        name: null,
        total_rows: 9,
        source_id: 115,
        num_row_errors: 0
      }
    },
    input_columns: {
      '1907': {
        soql_type: 'text',
        position: 0,
        input_schema_id: 98,
        id: 1907,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'id'
      },
      '1908': {
        soql_type: 'text',
        position: 1,
        input_schema_id: 98,
        id: 1908,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'case_number'
      },
      '1909': {
        soql_type: 'text',
        position: 2,
        input_schema_id: 98,
        id: 1909,
        guessed_subtypes: [],
        guessed_soql_type: 'calendar_date',
        field_name: 'date'
      },
      '1910': {
        soql_type: 'text',
        position: 3,
        input_schema_id: 98,
        id: 1910,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'block'
      },
      '1911': {
        soql_type: 'text',
        position: 4,
        input_schema_id: 98,
        id: 1911,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'iucr'
      },
      '1912': {
        soql_type: 'text',
        position: 5,
        input_schema_id: 98,
        id: 1912,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'primary_type'
      },
      '1913': {
        soql_type: 'text',
        position: 6,
        input_schema_id: 98,
        id: 1913,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'description'
      },
      '1914': {
        soql_type: 'text',
        position: 7,
        input_schema_id: 98,
        id: 1914,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'location_description'
      },
      '1915': {
        soql_type: 'text',
        position: 8,
        input_schema_id: 98,
        id: 1915,
        guessed_subtypes: [],
        guessed_soql_type: 'checkbox',
        field_name: 'arrest'
      },
      '1916': {
        soql_type: 'text',
        position: 9,
        input_schema_id: 98,
        id: 1916,
        guessed_subtypes: [],
        guessed_soql_type: 'checkbox',
        field_name: 'domestic'
      },
      '1917': {
        soql_type: 'text',
        position: 10,
        input_schema_id: 98,
        id: 1917,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'beat'
      },
      '1918': {
        soql_type: 'text',
        position: 11,
        input_schema_id: 98,
        id: 1918,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'district'
      },
      '1919': {
        soql_type: 'text',
        position: 12,
        input_schema_id: 98,
        id: 1919,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'ward'
      },
      '1920': {
        soql_type: 'text',
        position: 13,
        input_schema_id: 98,
        id: 1920,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'community_area'
      },
      '1921': {
        soql_type: 'text',
        position: 14,
        input_schema_id: 98,
        id: 1921,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'fbi_code'
      },
      '1922': {
        soql_type: 'text',
        position: 15,
        input_schema_id: 98,
        id: 1922,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'x_coordinate'
      },
      '1923': {
        soql_type: 'text',
        position: 16,
        input_schema_id: 98,
        id: 1923,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'y_coordinate'
      },
      '1924': {
        soql_type: 'text',
        position: 17,
        input_schema_id: 98,
        id: 1924,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'year'
      },
      '1925': {
        soql_type: 'text',
        position: 18,
        input_schema_id: 98,
        id: 1925,
        guessed_subtypes: [],
        guessed_soql_type: 'calendar_date',
        field_name: 'updated_on'
      },
      '1926': {
        soql_type: 'text',
        position: 19,
        input_schema_id: 98,
        id: 1926,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'latitude'
      },
      '1927': {
        soql_type: 'text',
        position: 20,
        input_schema_id: 98,
        id: 1927,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'longitude'
      },
      '1928': {
        soql_type: 'text',
        position: 21,
        input_schema_id: 98,
        id: 1928,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'location'
      }
    },
    output_schemas: {
      '144': {
        id: 144,
        input_schema_id: 98,
        error_count: 0,
        created_at: new Date(1497400637490),
        created_by: {
          user_id: 'tugg-ikce',
          email: 'brandon.webster@socrata.com',
          display_name: 'branweb'
        },
        output_columns: [
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1907
                }
              ],
              transform_expr: 'to_number(`id`)',
              output_soql_type: 'number',
              id: 1939,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 0,
            is_primary_key: false,
            id: 1945,
            field_name: 'id',
            display_name: 'ID',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1908
                }
              ],
              transform_expr: '`case_number`',
              output_soql_type: 'text',
              id: 1940,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 1,
            is_primary_key: false,
            id: 1946,
            field_name: 'case_number',
            display_name: 'Case Number',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1909
                }
              ],
              transform_expr: 'to_floating_timestamp(`date`)',
              output_soql_type: 'calendar_date',
              id: 1941,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 2,
            is_primary_key: false,
            id: 1947,
            field_name: 'date',
            display_name: 'Date',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1910
                }
              ],
              transform_expr: '`block`',
              output_soql_type: 'text',
              id: 1942,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 3,
            is_primary_key: false,
            id: 1948,
            field_name: 'block',
            display_name: 'Block',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1911
                }
              ],
              transform_expr: '`iucr`',
              output_soql_type: 'text',
              id: 1943,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 4,
            is_primary_key: false,
            id: 1949,
            field_name: 'iucr',
            display_name: 'IUCR',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1912
                }
              ],
              transform_expr: '`primary_type`',
              output_soql_type: 'text',
              id: 1944,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 5,
            is_primary_key: false,
            id: 1950,
            field_name: 'primary_type',
            display_name: 'Primary Type',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1913
                }
              ],
              transform_expr: '`description`',
              output_soql_type: 'text',
              id: 1945,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 6,
            is_primary_key: false,
            id: 1951,
            field_name: 'description',
            display_name: 'Description',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1914
                }
              ],
              transform_expr: '`location_description`',
              output_soql_type: 'text',
              id: 1946,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 7,
            is_primary_key: false,
            id: 1952,
            field_name: 'location_description',
            display_name: 'Location Description',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1915
                }
              ],
              transform_expr: 'to_boolean(`arrest`)',
              output_soql_type: 'checkbox',
              id: 1947,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 8,
            is_primary_key: false,
            id: 1953,
            field_name: 'arrest',
            display_name: 'Arrest',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1916
                }
              ],
              transform_expr: 'to_boolean(`domestic`)',
              output_soql_type: 'checkbox',
              id: 1948,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 9,
            is_primary_key: false,
            id: 1954,
            field_name: 'domestic',
            display_name: 'Domestic',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1917
                }
              ],
              transform_expr: 'to_number(`beat`)',
              output_soql_type: 'number',
              id: 1949,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 10,
            is_primary_key: false,
            id: 1955,
            field_name: 'beat',
            display_name: 'Beat',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1918
                }
              ],
              transform_expr: 'to_number(`district`)',
              output_soql_type: 'number',
              id: 1950,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 11,
            is_primary_key: false,
            id: 1956,
            field_name: 'district',
            display_name: 'District',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1919
                }
              ],
              transform_expr: 'to_number(`ward`)',
              output_soql_type: 'number',
              id: 1951,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 12,
            is_primary_key: false,
            id: 1957,
            field_name: 'ward',
            display_name: 'Ward',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1920
                }
              ],
              transform_expr: 'to_number(`community_area`)',
              output_soql_type: 'number',
              id: 1952,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 13,
            is_primary_key: false,
            id: 1958,
            field_name: 'community_area',
            display_name: 'Community Area',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1921
                }
              ],
              transform_expr: '`fbi_code`',
              output_soql_type: 'text',
              id: 1953,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 14,
            is_primary_key: false,
            id: 1959,
            field_name: 'fbi_code',
            display_name: 'FBI Code',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1922
                }
              ],
              transform_expr: 'to_number(`x_coordinate`)',
              output_soql_type: 'number',
              id: 1954,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 15,
            is_primary_key: false,
            id: 1960,
            field_name: 'x_coordinate',
            display_name: 'X Coordinate',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1923
                }
              ],
              transform_expr: 'to_number(`y_coordinate`)',
              output_soql_type: 'number',
              id: 1955,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 16,
            is_primary_key: false,
            id: 1961,
            field_name: 'y_coordinate',
            display_name: 'Y Coordinate',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1924
                }
              ],
              transform_expr: 'to_number(`year`)',
              output_soql_type: 'number',
              id: 1956,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 17,
            is_primary_key: false,
            id: 1962,
            field_name: 'year',
            display_name: 'Year',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1925
                }
              ],
              transform_expr: 'to_floating_timestamp(`updated_on`)',
              output_soql_type: 'calendar_date',
              id: 1957,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 18,
            is_primary_key: false,
            id: 1963,
            field_name: 'updated_on',
            display_name: 'Updated On',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1926
                }
              ],
              transform_expr: 'to_number(`latitude`)',
              output_soql_type: 'number',
              id: 1958,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 19,
            is_primary_key: false,
            id: 1964,
            field_name: 'latitude',
            display_name: 'Latitude',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1927
                }
              ],
              transform_expr: 'to_number(`longitude`)',
              output_soql_type: 'number',
              id: 1959,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 20,
            is_primary_key: false,
            id: 1965,
            field_name: 'longitude',
            display_name: 'Longitude',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 1928
                }
              ],
              transform_expr: '`location`',
              output_soql_type: 'text',
              id: 1960,
              failed_at: null,
              completed_at: '2017-06-14T00:37:21',
              attempts: 0
            },
            position: 21,
            is_primary_key: false,
            id: 1966,
            field_name: 'location',
            display_name: 'Location',
            description: ''
          }
        ],
        completed_at: new Date(1497400641000)
      }
    },
    output_columns: {
      '1945': {
        position: 0,
        is_primary_key: false,
        id: 1945,
        field_name: 'id',
        display_name: 'ID',
        description: '',
        transform_id: 1939
      },
      '1946': {
        position: 1,
        is_primary_key: false,
        id: 1946,
        field_name: 'case_number',
        display_name: 'Case Number',
        description: '',
        transform_id: 1940
      },
      '1947': {
        position: 2,
        is_primary_key: false,
        id: 1947,
        field_name: 'date',
        display_name: 'Date',
        description: '',
        transform_id: 1941
      },
      '1948': {
        position: 3,
        is_primary_key: false,
        id: 1948,
        field_name: 'block',
        display_name: 'Block',
        description: '',
        transform_id: 1942
      },
      '1949': {
        position: 4,
        is_primary_key: false,
        id: 1949,
        field_name: 'iucr',
        display_name: 'IUCR',
        description: '',
        transform_id: 1943
      },
      '1950': {
        position: 5,
        is_primary_key: false,
        id: 1950,
        field_name: 'primary_type',
        display_name: 'Primary Type',
        description: '',
        transform_id: 1944
      },
      '1951': {
        position: 6,
        is_primary_key: false,
        id: 1951,
        field_name: 'description',
        display_name: 'Description',
        description: '',
        transform_id: 1945
      },
      '1952': {
        position: 7,
        is_primary_key: false,
        id: 1952,
        field_name: 'location_description',
        display_name: 'Location Description',
        description: '',
        transform_id: 1946
      },
      '1953': {
        position: 8,
        is_primary_key: false,
        id: 1953,
        field_name: 'arrest',
        display_name: 'Arrest',
        description: '',
        transform_id: 1947
      },
      '1954': {
        position: 9,
        is_primary_key: false,
        id: 1954,
        field_name: 'domestic',
        display_name: 'Domestic',
        description: '',
        transform_id: 1948
      },
      '1955': {
        position: 10,
        is_primary_key: false,
        id: 1955,
        field_name: 'beat',
        display_name: 'Beat',
        description: '',
        transform_id: 1949
      },
      '1956': {
        position: 11,
        is_primary_key: false,
        id: 1956,
        field_name: 'district',
        display_name: 'District',
        description: '',
        transform_id: 1950
      },
      '1957': {
        position: 12,
        is_primary_key: false,
        id: 1957,
        field_name: 'ward',
        display_name: 'Ward',
        description: '',
        transform_id: 1951
      },
      '1958': {
        position: 13,
        is_primary_key: false,
        id: 1958,
        field_name: 'community_area',
        display_name: 'Community Area',
        description: '',
        transform_id: 1952
      },
      '1959': {
        position: 14,
        is_primary_key: false,
        id: 1959,
        field_name: 'fbi_code',
        display_name: 'FBI Code',
        description: '',
        transform_id: 1953
      },
      '1960': {
        position: 15,
        is_primary_key: false,
        id: 1960,
        field_name: 'x_coordinate',
        display_name: 'X Coordinate',
        description: '',
        transform_id: 1954
      },
      '1961': {
        position: 16,
        is_primary_key: false,
        id: 1961,
        field_name: 'y_coordinate',
        display_name: 'Y Coordinate',
        description: '',
        transform_id: 1955
      },
      '1962': {
        position: 17,
        is_primary_key: false,
        id: 1962,
        field_name: 'year',
        display_name: 'Year',
        description: '',
        transform_id: 1956
      },
      '1963': {
        position: 18,
        is_primary_key: false,
        id: 1963,
        field_name: 'updated_on',
        display_name: 'Updated On',
        description: '',
        transform_id: 1957
      },
      '1964': {
        position: 19,
        is_primary_key: false,
        id: 1964,
        field_name: 'latitude',
        display_name: 'Latitude',
        description: '',
        transform_id: 1958
      },
      '1965': {
        position: 20,
        is_primary_key: false,
        id: 1965,
        field_name: 'longitude',
        display_name: 'Longitude',
        description: '',
        transform_id: 1959
      },
      '1966': {
        position: 21,
        is_primary_key: false,
        id: 1966,
        field_name: 'location',
        display_name: 'Location',
        description: '',
        transform_id: 1960
      }
    },
    output_schema_columns: {
      '144-1945': {
        id: '144-1945',
        output_schema_id: 144,
        output_column_id: 1945,
        is_primary_key: false
      },
      '144-1946': {
        id: '144-1946',
        output_schema_id: 144,
        output_column_id: 1946,
        is_primary_key: false
      },
      '144-1947': {
        id: '144-1947',
        output_schema_id: 144,
        output_column_id: 1947,
        is_primary_key: false
      },
      '144-1948': {
        id: '144-1948',
        output_schema_id: 144,
        output_column_id: 1948,
        is_primary_key: false
      },
      '144-1949': {
        id: '144-1949',
        output_schema_id: 144,
        output_column_id: 1949,
        is_primary_key: false
      },
      '144-1950': {
        id: '144-1950',
        output_schema_id: 144,
        output_column_id: 1950,
        is_primary_key: false
      },
      '144-1951': {
        id: '144-1951',
        output_schema_id: 144,
        output_column_id: 1951,
        is_primary_key: false
      },
      '144-1952': {
        id: '144-1952',
        output_schema_id: 144,
        output_column_id: 1952,
        is_primary_key: false
      },
      '144-1953': {
        id: '144-1953',
        output_schema_id: 144,
        output_column_id: 1953,
        is_primary_key: false
      },
      '144-1954': {
        id: '144-1954',
        output_schema_id: 144,
        output_column_id: 1954,
        is_primary_key: false
      },
      '144-1955': {
        id: '144-1955',
        output_schema_id: 144,
        output_column_id: 1955,
        is_primary_key: false
      },
      '144-1956': {
        id: '144-1956',
        output_schema_id: 144,
        output_column_id: 1956,
        is_primary_key: false
      },
      '144-1957': {
        id: '144-1957',
        output_schema_id: 144,
        output_column_id: 1957,
        is_primary_key: false
      },
      '144-1958': {
        id: '144-1958',
        output_schema_id: 144,
        output_column_id: 1958,
        is_primary_key: false
      },
      '144-1959': {
        id: '144-1959',
        output_schema_id: 144,
        output_column_id: 1959,
        is_primary_key: false
      },
      '144-1960': {
        id: '144-1960',
        output_schema_id: 144,
        output_column_id: 1960,
        is_primary_key: false
      },
      '144-1961': {
        id: '144-1961',
        output_schema_id: 144,
        output_column_id: 1961,
        is_primary_key: false
      },
      '144-1962': {
        id: '144-1962',
        output_schema_id: 144,
        output_column_id: 1962,
        is_primary_key: false
      },
      '144-1963': {
        id: '144-1963',
        output_schema_id: 144,
        output_column_id: 1963,
        is_primary_key: false
      },
      '144-1964': {
        id: '144-1964',
        output_schema_id: 144,
        output_column_id: 1964,
        is_primary_key: false
      },
      '144-1965': {
        id: '144-1965',
        output_schema_id: 144,
        output_column_id: 1965,
        is_primary_key: false
      },
      '144-1966': {
        id: '144-1966',
        output_schema_id: 144,
        output_column_id: 1966,
        is_primary_key: false
      }
    },
    transforms: {
      '1939': {
        transform_input_columns: [
          {
            input_column_id: 1907
          }
        ],
        transform_expr: 'to_number(`id`)',
        output_soql_type: 'number',
        id: 1939,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1940': {
        transform_input_columns: [
          {
            input_column_id: 1908
          }
        ],
        transform_expr: '`case_number`',
        output_soql_type: 'text',
        id: 1940,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1941': {
        transform_input_columns: [
          {
            input_column_id: 1909
          }
        ],
        transform_expr: 'to_floating_timestamp(`date`)',
        output_soql_type: 'calendar_date',
        id: 1941,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1942': {
        transform_input_columns: [
          {
            input_column_id: 1910
          }
        ],
        transform_expr: '`block`',
        output_soql_type: 'text',
        id: 1942,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1943': {
        transform_input_columns: [
          {
            input_column_id: 1911
          }
        ],
        transform_expr: '`iucr`',
        output_soql_type: 'text',
        id: 1943,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1944': {
        transform_input_columns: [
          {
            input_column_id: 1912
          }
        ],
        transform_expr: '`primary_type`',
        output_soql_type: 'text',
        id: 1944,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1945': {
        transform_input_columns: [
          {
            input_column_id: 1913
          }
        ],
        transform_expr: '`description`',
        output_soql_type: 'text',
        id: 1945,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1946': {
        transform_input_columns: [
          {
            input_column_id: 1914
          }
        ],
        transform_expr: '`location_description`',
        output_soql_type: 'text',
        id: 1946,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1947': {
        transform_input_columns: [
          {
            input_column_id: 1915
          }
        ],
        transform_expr: 'to_boolean(`arrest`)',
        output_soql_type: 'checkbox',
        id: 1947,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1948': {
        transform_input_columns: [
          {
            input_column_id: 1916
          }
        ],
        transform_expr: 'to_boolean(`domestic`)',
        output_soql_type: 'checkbox',
        id: 1948,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1949': {
        transform_input_columns: [
          {
            input_column_id: 1917
          }
        ],
        transform_expr: 'to_number(`beat`)',
        output_soql_type: 'number',
        id: 1949,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1950': {
        transform_input_columns: [
          {
            input_column_id: 1918
          }
        ],
        transform_expr: 'to_number(`district`)',
        output_soql_type: 'number',
        id: 1950,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1951': {
        transform_input_columns: [
          {
            input_column_id: 1919
          }
        ],
        transform_expr: 'to_number(`ward`)',
        output_soql_type: 'number',
        id: 1951,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1952': {
        transform_input_columns: [
          {
            input_column_id: 1920
          }
        ],
        transform_expr: 'to_number(`community_area`)',
        output_soql_type: 'number',
        id: 1952,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1953': {
        transform_input_columns: [
          {
            input_column_id: 1921
          }
        ],
        transform_expr: '`fbi_code`',
        output_soql_type: 'text',
        id: 1953,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1954': {
        transform_input_columns: [
          {
            input_column_id: 1922
          }
        ],
        transform_expr: 'to_number(`x_coordinate`)',
        output_soql_type: 'number',
        id: 1954,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1955': {
        transform_input_columns: [
          {
            input_column_id: 1923
          }
        ],
        transform_expr: 'to_number(`y_coordinate`)',
        output_soql_type: 'number',
        id: 1955,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1956': {
        transform_input_columns: [
          {
            input_column_id: 1924
          }
        ],
        transform_expr: 'to_number(`year`)',
        output_soql_type: 'number',
        id: 1956,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1957': {
        transform_input_columns: [
          {
            input_column_id: 1925
          }
        ],
        transform_expr: 'to_floating_timestamp(`updated_on`)',
        output_soql_type: 'calendar_date',
        id: 1957,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1958': {
        transform_input_columns: [
          {
            input_column_id: 1926
          }
        ],
        transform_expr: 'to_number(`latitude`)',
        output_soql_type: 'number',
        id: 1958,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1959': {
        transform_input_columns: [
          {
            input_column_id: 1927
          }
        ],
        transform_expr: 'to_number(`longitude`)',
        output_soql_type: 'number',
        id: 1959,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      },
      '1960': {
        transform_input_columns: [
          {
            input_column_id: 1928
          }
        ],
        transform_expr: '`location`',
        output_soql_type: 'text',
        id: 1960,
        failed_at: null,
        completed_at: '2017-06-14T00:37:21',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 9
      }
    },
    task_sets: {},
    email_interests: {},
    row_errors: {},
    col_data: {
      '1939': {
        '0': {
          id: 0,
          ok: '10376594'
        },
        '1': {
          id: 1,
          ok: '10376574'
        },
        '2': {
          id: 2,
          ok: '10376371'
        },
        '3': {
          id: 3,
          ok: '10380234'
        },
        '4': {
          id: 4,
          ok: '10375856'
        },
        '5': {
          id: 5,
          ok: '10375836'
        },
        '6': {
          id: 6,
          ok: '10376791'
        },
        '7': {
          id: 7,
          ok: '10375849'
        },
        '8': {
          id: 8,
          ok: '10376251'
        }
      },
      '1940': {
        '0': {
          id: 0,
          ok: 'HZ112917'
        },
        '1': {
          id: 1,
          ok: 'HZ112920'
        },
        '2': {
          id: 2,
          ok: 'HZ112605'
        },
        '3': {
          id: 3,
          ok: 'HZ116304'
        },
        '4': {
          id: 4,
          ok: 'HZ112435'
        },
        '5': {
          id: 5,
          ok: 'HZ112407'
        },
        '6': {
          id: 6,
          ok: 'HZ112953'
        },
        '7': {
          id: 7,
          ok: 'HZ112411'
        },
        '8': {
          id: 8,
          ok: 'HZ112670'
        }
      },
      '1941': {
        '0': {
          id: 0,
          ok: '2016-01-11T23:53:00.000'
        },
        '1': {
          id: 1,
          ok: '2016-01-11T23:45:00.000'
        },
        '2': {
          id: 2,
          ok: '2016-01-11T23:30:00.000'
        },
        '3': {
          id: 3,
          ok: '2016-01-11T23:30:00.000'
        },
        '4': {
          id: 4,
          ok: '2016-01-11T23:30:00.000'
        },
        '5': {
          id: 5,
          ok: '2016-01-11T23:25:00.000'
        },
        '6': {
          id: 6,
          ok: '2016-01-11T23:20:00.000'
        },
        '7': {
          id: 7,
          ok: '2016-01-11T23:15:00.000'
        },
        '8': {
          id: 8,
          ok: '2016-01-11T23:15:00.000'
        }
      },
      '1942': {
        '0': {
          id: 0,
          ok: '004XX S LARAMIE AVE'
        },
        '1': {
          id: 1,
          ok: '003XX N CENTRAL AVE'
        },
        '2': {
          id: 2,
          ok: '004XX E 48TH ST'
        },
        '3': {
          id: 3,
          ok: '055XX S CORNELL AVE'
        },
        '4': {
          id: 4,
          ok: '001XX S CENTRAL AVE'
        },
        '5': {
          id: 5,
          ok: '063XX S KEDZIE AVE'
        },
        '6': {
          id: 6,
          ok: '004XX W 76TH ST'
        },
        '7': {
          id: 7,
          ok: '024XX N NARRAGANSETT AVE'
        },
        '8': {
          id: 8,
          ok: '037XX W FLOURNOY ST'
        }
      },
      '1943': {
        '0': {
          id: 0,
          ok: '031A'
        },
        '1': {
          id: 1,
          ok: '031A'
        },
        '2': {
          id: 2,
          ok: '910'
        },
        '3': {
          id: 3,
          ok: '910'
        },
        '4': {
          id: 4,
          ok: '560'
        },
        '5': {
          id: 5,
          ok: '1330'
        },
        '6': {
          id: 6,
          ok: '031A'
        },
        '7': {
          id: 7,
          ok: '460'
        },
        '8': {
          id: 8,
          ok: '820'
        }
      },
      '1944': {
        '0': {
          id: 0,
          ok: 'ROBBERY'
        },
        '1': {
          id: 1,
          ok: 'ROBBERY'
        },
        '2': {
          id: 2,
          ok: 'MOTOR VEHICLE THEFT'
        },
        '3': {
          id: 3,
          ok: 'MOTOR VEHICLE THEFT'
        },
        '4': {
          id: 4,
          ok: 'ASSAULT'
        },
        '5': {
          id: 5,
          ok: 'CRIMINAL TRESPASS'
        },
        '6': {
          id: 6,
          ok: 'ROBBERY'
        },
        '7': {
          id: 7,
          ok: 'BATTERY'
        },
        '8': {
          id: 8,
          ok: 'THEFT'
        }
      },
      '1945': {
        '0': {
          id: 0,
          ok: 'ARMED: HANDGUN'
        },
        '1': {
          id: 1,
          ok: 'ARMED: HANDGUN'
        },
        '2': {
          id: 2,
          ok: 'AUTOMOBILE'
        },
        '3': {
          id: 3,
          ok: 'AUTOMOBILE'
        },
        '4': {
          id: 4,
          ok: 'SIMPLE'
        },
        '5': {
          id: 5,
          ok: 'TO LAND'
        },
        '6': {
          id: 6,
          ok: 'ARMED: HANDGUN'
        },
        '7': {
          id: 7,
          ok: 'SIMPLE'
        },
        '8': {
          id: 8,
          ok: '$500 AND UNDER'
        }
      },
      '1946': {
        '0': {
          id: 0,
          ok: 'SIDEWALK'
        },
        '1': {
          id: 1,
          ok: 'STREET'
        },
        '2': {
          id: 2,
          ok: 'STREET'
        },
        '3': {
          id: 3,
          ok: 'STREET'
        },
        '4': {
          id: 4,
          ok: 'RESIDENCE'
        },
        '5': {
          id: 5,
          ok: 'DRUG STORE'
        },
        '6': {
          id: 6,
          ok: 'OTHER'
        },
        '7': {
          id: 7,
          ok: 'ATHLETIC CLUB'
        },
        '8': {
          id: 8,
          ok: 'STREET'
        }
      },
      '1947': {
        '0': {
          id: 0,
          ok: false
        },
        '1': {
          id: 1,
          ok: false
        },
        '2': {
          id: 2,
          ok: false
        },
        '3': {
          id: 3,
          ok: false
        },
        '4': {
          id: 4,
          ok: false
        },
        '5': {
          id: 5,
          ok: false
        },
        '6': {
          id: 6,
          ok: false
        },
        '7': {
          id: 7,
          ok: false
        },
        '8': {
          id: 8,
          ok: false
        }
      },
      '1948': {
        '0': {
          id: 0,
          ok: false
        },
        '1': {
          id: 1,
          ok: false
        },
        '2': {
          id: 2,
          ok: false
        },
        '3': {
          id: 3,
          ok: false
        },
        '4': {
          id: 4,
          ok: false
        },
        '5': {
          id: 5,
          ok: false
        },
        '6': {
          id: 6,
          ok: false
        },
        '7': {
          id: 7,
          ok: false
        },
        '8': {
          id: 8,
          ok: false
        }
      },
      '1949': {
        '0': {
          id: 0,
          ok: '1522'
        },
        '1': {
          id: 1,
          ok: '1523'
        },
        '2': {
          id: 2,
          ok: '223'
        },
        '3': {
          id: 3,
          ok: '235'
        },
        '4': {
          id: 4,
          ok: '1522'
        },
        '5': {
          id: 5,
          ok: '823'
        },
        '6': {
          id: 6,
          ok: '621'
        },
        '7': {
          id: 7,
          ok: '2512'
        },
        '8': {
          id: 8,
          ok: '1133'
        }
      },
      '1950': {
        '0': {
          id: 0,
          ok: '15'
        },
        '1': {
          id: 1,
          ok: '15'
        },
        '2': {
          id: 2,
          ok: '2'
        },
        '3': {
          id: 3,
          ok: '2'
        },
        '4': {
          id: 4,
          ok: '15'
        },
        '5': {
          id: 5,
          ok: '8'
        },
        '6': {
          id: 6,
          ok: '6'
        },
        '7': {
          id: 7,
          ok: '25'
        },
        '8': {
          id: 8,
          ok: '11'
        }
      },
      '1951': {
        '0': {
          id: 0,
          ok: '29'
        },
        '1': {
          id: 1,
          ok: '28'
        },
        '2': {
          id: 2,
          ok: '3'
        },
        '3': {
          id: 3,
          ok: '5'
        },
        '4': {
          id: 4,
          ok: '29'
        },
        '5': {
          id: 5,
          ok: '15'
        },
        '6': {
          id: 6,
          ok: '17'
        },
        '7': {
          id: 7,
          ok: '36'
        },
        '8': {
          id: 8,
          ok: '24'
        }
      },
      '1952': {
        '0': {
          id: 0,
          ok: '25'
        },
        '1': {
          id: 1,
          ok: '25'
        },
        '2': {
          id: 2,
          ok: '38'
        },
        '3': {
          id: 3,
          ok: '41'
        },
        '4': {
          id: 4,
          ok: '25'
        },
        '5': {
          id: 5,
          ok: '66'
        },
        '6': {
          id: 6,
          ok: '69'
        },
        '7': {
          id: 7,
          ok: '19'
        },
        '8': {
          id: 8,
          ok: '27'
        }
      },
      '1953': {
        '0': {
          id: 0,
          ok: '3'
        },
        '1': {
          id: 1,
          ok: '3'
        },
        '2': {
          id: 2,
          ok: '7'
        },
        '3': {
          id: 3,
          ok: '7'
        },
        '4': {
          id: 4,
          ok: '08A'
        },
        '5': {
          id: 5,
          ok: '26'
        },
        '6': {
          id: 6,
          ok: '3'
        },
        '7': {
          id: 7,
          ok: '08B'
        },
        '8': {
          id: 8,
          ok: '6'
        }
      },
      '1954': {
        '0': {
          id: 0,
          ok: '1141799'
        },
        '1': {
          id: 1,
          ok: '1138978'
        },
        '2': {
          id: 2,
          ok: '1180055'
        },
        '3': {
          id: 3,
          ok: '1188201'
        },
        '4': {
          id: 4,
          ok: '1139082'
        },
        '5': {
          id: 5,
          ok: '1156143'
        },
        '6': {
          id: 6,
          ok: '1174859'
        },
        '7': {
          id: 7,
          ok: '1133346'
        },
        '8': {
          id: 8,
          ok: '1151652'
        }
      },
      '1955': {
        '0': {
          id: 0,
          ok: '1897396'
        },
        '1': {
          id: 1,
          ok: '1901836'
        },
        '2': {
          id: 2,
          ok: '1873293'
        },
        '3': {
          id: 3,
          ok: '1868688'
        },
        '4': {
          id: 4,
          ok: '1898717'
        },
        '5': {
          id: 5,
          ok: '1862448'
        },
        '6': {
          id: 6,
          ok: '1854542'
        },
        '7': {
          id: 7,
          ok: '1915440'
        },
        '8': {
          id: 8,
          ok: '1896775'
        }
      },
      '1956': {
        '0': {
          id: 0,
          ok: '2016'
        },
        '1': {
          id: 1,
          ok: '2016'
        },
        '2': {
          id: 2,
          ok: '2016'
        },
        '3': {
          id: 3,
          ok: '2016'
        },
        '4': {
          id: 4,
          ok: '2016'
        },
        '5': {
          id: 5,
          ok: '2016'
        },
        '6': {
          id: 6,
          ok: '2016'
        },
        '7': {
          id: 7,
          ok: '2016'
        },
        '8': {
          id: 8,
          ok: '2016'
        }
      },
      '1957': {
        '0': {
          id: 0,
          ok: '2016-01-18T15:54:00.000'
        },
        '1': {
          id: 1,
          ok: '2016-01-18T15:54:00.000'
        },
        '2': {
          id: 2,
          ok: '2016-01-18T15:54:00.000'
        },
        '3': {
          id: 3,
          ok: '2016-01-18T15:54:00.000'
        },
        '4': {
          id: 4,
          ok: '2016-01-18T15:54:00.000'
        },
        '5': {
          id: 5,
          ok: '2016-01-18T15:54:00.000'
        },
        '6': {
          id: 6,
          ok: '2016-01-18T15:54:00.000'
        },
        '7': {
          id: 7,
          ok: '2016-01-18T15:54:00.000'
        },
        '8': {
          id: 8,
          ok: '2016-01-18T15:54:00.000'
        }
      },
      '1958': {
        '0': {
          id: 0,
          ok: '41.87452002'
        },
        '1': {
          id: 1,
          ok: '41.88675567'
        },
        '2': {
          id: 2,
          ok: '41.80758633'
        },
        '3': {
          id: 3,
          ok: '41.7947592'
        },
        '4': {
          id: 4,
          ok: '41.87819484'
        },
        '5': {
          id: 5,
          ok: '41.77834098'
        },
        '6': {
          id: 6,
          ok: '41.75624913'
        },
        '7': {
          id: 7,
          ok: '41.92418726'
        },
        '8': {
          id: 8,
          ok: '41.87262801'
        }
      },
      '1959': {
        '0': {
          id: 0,
          ok: '-87.75484623'
        },
        '1': {
          id: 1,
          ok: '-87.76509592'
        },
        '2': {
          id: 2,
          ok: '-87.61512779'
        },
        '3': {
          id: 3,
          ok: '-87.58539793'
        },
        '4': {
          id: 4,
          ok: '-87.76478988'
        },
        '5': {
          id: 5,
          ok: '-87.70312224'
        },
        '6': {
          id: 6,
          ok: '-87.63474388'
        },
        '7': {
          id: 7,
          ok: '-87.7854594'
        },
        '8': {
          id: 8,
          ok: '-87.71868635'
        }
      },
      '1960': {
        '0': {
          id: 0,
          ok: '(41.874520022, -87.754846231)'
        },
        '1': {
          id: 1,
          ok: '(41.886755667, -87.765095923)'
        },
        '2': {
          id: 2,
          ok: '(41.807586328, -87.615127788)'
        },
        '3': {
          id: 3,
          ok: '(41.794759204, -87.585397931)'
        },
        '4': {
          id: 4,
          ok: '(41.878194837, -87.764789883)'
        },
        '5': {
          id: 5,
          ok: '(41.778340981, -87.703122242)'
        },
        '6': {
          id: 6,
          ok: '(41.756249125, -87.634743877)'
        },
        '7': {
          id: 7,
          ok: '(41.924187262, -87.785459395)'
        },
        '8': {
          id: 8,
          ok: '(41.872628006, -87.718686345)'
        }
      }
    }
  },
  ui: {
    flashMessage: {
      message: '',
      kind: '',
      visible: false
    },
    history: [
      {
        pathname:
          '/dataset/omgwtf/kg5j-unyr/revisions/0/sources/115/schemas/98/output/144',
        search: '',
        hash: '',
        action: 'POP',
        key: null,
        query: {}
      },
      {
        pathname: '/dataset/omgwtf/kg5j-unyr/revisions/0',
        search: '',
        hash: '',
        action: 'PUSH',
        key: '4umla7',
        query: {}
      },
      {
        pathname: '/dataset/omgwtf/kg5j-unyr/revisions/0/metadata/columns',
        search: '',
        hash: '',
        action: 'PUSH',
        key: 'jnpde4',
        query: {}
      }
    ],
    notifications: [],
    modal: {
      visible: false,
      contentComponentName: null,
      payload: null
    },
    apiCalls: {
      'e627a631-875d-4684-8ede-505f54dc88ec': {
        id: 'e627a631-875d-4684-8ede-505f54dc88ec',
        status: 'STATUS_CALL_SUCCEEDED',
        operation: 'LOAD_ROWS',
        params: {
          displayState: {
            type: 'NORMAL',
            pageNo: 1,
            outputSchemaId: 144
          }
        },
        startedAt: new Date(1497461279461),
        succeededAt: new Date(1497461280084)
      }
    }
  }
};

export default initialState;
