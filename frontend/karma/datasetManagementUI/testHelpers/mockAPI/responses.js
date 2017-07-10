export const sourceCreate = {
  resource: {
    schemas: [],
    created_at: '2017-05-12T14:12:09.293177',
    id: 823,
    finished_at: null,
    source_type: {
      filename: 'petty_crimes.csv',
      type: 'upload'
    },
    failed_at: null,
    created_by: {
      user_id: 'yczc-8men',
      email: 'brandon.webster@socrata.com',
      display_name: 'Brandon Webster'
    },
    content_type: null
  },
  links: {
    show: '/api/publishing/v1/source/823',
    bytes: '/api/publishing/v1/source/823',
    add_to_revision: '/api/publishing/v1/source/823'
  }
};

export const sourceBytes = {
  resource: {
    total_rows: 9,
    output_schemas: [
      {
        output_columns: [
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22277
                }
              ],
              transform_expr: 'to_number(`id`)',
              output_soql_type: 'number',
              id: 20799,
              completed_at: null
            },
            position: 0,
            is_primary_key: false,
            id: 18133,
            field_name: 'id',
            display_name: 'ID',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22278
                }
              ],
              transform_expr: '`case_number`',
              output_soql_type: 'text',
              id: 20800,
              completed_at: null
            },
            position: 1,
            is_primary_key: false,
            id: 18134,
            field_name: 'case_number',
            display_name: 'Case Number',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22279
                }
              ],
              transform_expr: 'to_floating_timestamp(`date`)',
              output_soql_type: 'calendar_date',
              id: 20801,
              completed_at: null
            },
            position: 2,
            is_primary_key: false,
            id: 18135,
            field_name: 'date',
            display_name: 'Date',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22280
                }
              ],
              transform_expr: '`block`',
              output_soql_type: 'text',
              id: 20802,
              completed_at: null
            },
            position: 3,
            is_primary_key: false,
            id: 18136,
            field_name: 'block',
            display_name: 'Block',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22281
                }
              ],
              transform_expr: '`iucr`',
              output_soql_type: 'text',
              id: 20803,
              completed_at: null
            },
            position: 4,
            is_primary_key: false,
            id: 18137,
            field_name: 'iucr',
            display_name: 'IUCR',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22282
                }
              ],
              transform_expr: '`primary_type`',
              output_soql_type: 'text',
              id: 20804,
              completed_at: null
            },
            position: 5,
            is_primary_key: false,
            id: 18138,
            field_name: 'primary_type',
            display_name: 'Primary Type',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22283
                }
              ],
              transform_expr: '`description`',
              output_soql_type: 'text',
              id: 20805,
              completed_at: null
            },
            position: 6,
            is_primary_key: false,
            id: 18139,
            field_name: 'description',
            display_name: 'Description',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22284
                }
              ],
              transform_expr: '`location_description`',
              output_soql_type: 'text',
              id: 20806,
              completed_at: null
            },
            position: 7,
            is_primary_key: false,
            id: 18140,
            field_name: 'location_description',
            display_name: 'Location Description',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22285
                }
              ],
              transform_expr: 'to_boolean(`arrest`)',
              output_soql_type: 'checkbox',
              id: 20807,
              completed_at: null
            },
            position: 8,
            is_primary_key: false,
            id: 18141,
            field_name: 'arrest',
            display_name: 'Arrest',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22286
                }
              ],
              transform_expr: 'to_boolean(`domestic`)',
              output_soql_type: 'checkbox',
              id: 20808,
              completed_at: null
            },
            position: 9,
            is_primary_key: false,
            id: 18142,
            field_name: 'domestic',
            display_name: 'Domestic',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22287
                }
              ],
              transform_expr: 'to_number(`beat`)',
              output_soql_type: 'number',
              id: 20809,
              completed_at: null
            },
            position: 10,
            is_primary_key: false,
            id: 18143,
            field_name: 'beat',
            display_name: 'Beat',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22288
                }
              ],
              transform_expr: 'to_number(`district`)',
              output_soql_type: 'number',
              id: 20810,
              completed_at: null
            },
            position: 11,
            is_primary_key: false,
            id: 18144,
            field_name: 'district',
            display_name: 'District',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22289
                }
              ],
              transform_expr: 'to_number(`ward`)',
              output_soql_type: 'number',
              id: 20811,
              completed_at: null
            },
            position: 12,
            is_primary_key: false,
            id: 18145,
            field_name: 'ward',
            display_name: 'Ward',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22290
                }
              ],
              transform_expr: 'to_number(`community_area`)',
              output_soql_type: 'number',
              id: 20812,
              completed_at: null
            },
            position: 13,
            is_primary_key: false,
            id: 18146,
            field_name: 'community_area',
            display_name: 'Community Area',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22291
                }
              ],
              transform_expr: '`fbi_code`',
              output_soql_type: 'text',
              id: 20813,
              completed_at: null
            },
            position: 14,
            is_primary_key: false,
            id: 18147,
            field_name: 'fbi_code',
            display_name: 'FBI Code',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22292
                }
              ],
              transform_expr: 'to_number(`x_coordinate`)',
              output_soql_type: 'number',
              id: 20814,
              completed_at: null
            },
            position: 15,
            is_primary_key: false,
            id: 18148,
            field_name: 'x_coordinate',
            display_name: 'X Coordinate',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22293
                }
              ],
              transform_expr: 'to_number(`y_coordinate`)',
              output_soql_type: 'number',
              id: 20815,
              completed_at: null
            },
            position: 16,
            is_primary_key: false,
            id: 18149,
            field_name: 'y_coordinate',
            display_name: 'Y Coordinate',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22294
                }
              ],
              transform_expr: 'to_number(`year`)',
              output_soql_type: 'number',
              id: 20816,
              completed_at: null
            },
            position: 17,
            is_primary_key: false,
            id: 18150,
            field_name: 'year',
            display_name: 'Year',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22295
                }
              ],
              transform_expr: 'to_floating_timestamp(`updated_on`)',
              output_soql_type: 'calendar_date',
              id: 20817,
              completed_at: null
            },
            position: 18,
            is_primary_key: false,
            id: 18151,
            field_name: 'updated_on',
            display_name: 'Updated On',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22296
                }
              ],
              transform_expr: 'to_number(`latitude`)',
              output_soql_type: 'number',
              id: 20818,
              completed_at: null
            },
            position: 19,
            is_primary_key: false,
            id: 18152,
            field_name: 'latitude',
            display_name: 'Latitude',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22297
                }
              ],
              transform_expr: 'to_number(`longitude`)',
              output_soql_type: 'number',
              id: 20819,
              completed_at: null
            },
            position: 20,
            is_primary_key: false,
            id: 18153,
            field_name: 'longitude',
            display_name: 'Longitude',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 22298
                }
              ],
              transform_expr: '`location`',
              output_soql_type: 'text',
              id: 20820,
              completed_at: null
            },
            position: 21,
            is_primary_key: false,
            id: 18154,
            field_name: 'location',
            display_name: 'Location',
            description: ''
          }
        ],
        created_at: '2017-05-12T14:12:21.648593',
        input_schema_id: 945,
        id: 1145,
        error_count: 0,
        created_by: {
          user_id: 'yczc-8men',
          email: 'brandon.webster@socrata.com',
          display_name: 'Brandon Webster'
        },
        completed_at: null
      }
    ],
    name: null,
    created_at: '2017-05-12T14:12:09.412481',
    input_columns: [
      {
        soql_type: 'text',
        position: 0,
        input_schema_id: 945,
        id: 22277,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'id'
      },
      {
        soql_type: 'text',
        position: 1,
        input_schema_id: 945,
        id: 22278,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'case_number'
      },
      {
        soql_type: 'text',
        position: 2,
        input_schema_id: 945,
        id: 22279,
        guessed_subtypes: [],
        guessed_soql_type: 'calendar_date',
        field_name: 'date'
      },
      {
        soql_type: 'text',
        position: 3,
        input_schema_id: 945,
        id: 22280,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'block'
      },
      {
        soql_type: 'text',
        position: 4,
        input_schema_id: 945,
        id: 22281,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'iucr'
      },
      {
        soql_type: 'text',
        position: 5,
        input_schema_id: 945,
        id: 22282,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'primary_type'
      },
      {
        soql_type: 'text',
        position: 6,
        input_schema_id: 945,
        id: 22283,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'description'
      },
      {
        soql_type: 'text',
        position: 7,
        input_schema_id: 945,
        id: 22284,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'location_description'
      },
      {
        soql_type: 'text',
        position: 8,
        input_schema_id: 945,
        id: 22285,
        guessed_subtypes: [],
        guessed_soql_type: 'checkbox',
        field_name: 'arrest'
      },
      {
        soql_type: 'text',
        position: 9,
        input_schema_id: 945,
        id: 22286,
        guessed_subtypes: [],
        guessed_soql_type: 'checkbox',
        field_name: 'domestic'
      },
      {
        soql_type: 'text',
        position: 10,
        input_schema_id: 945,
        id: 22287,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'beat'
      },
      {
        soql_type: 'text',
        position: 11,
        input_schema_id: 945,
        id: 22288,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'district'
      },
      {
        soql_type: 'text',
        position: 12,
        input_schema_id: 945,
        id: 22289,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'ward'
      },
      {
        soql_type: 'text',
        position: 13,
        input_schema_id: 945,
        id: 22290,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'community_area'
      },
      {
        soql_type: 'text',
        position: 14,
        input_schema_id: 945,
        id: 22291,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'fbi_code'
      },
      {
        soql_type: 'text',
        position: 15,
        input_schema_id: 945,
        id: 22292,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'x_coordinate'
      },
      {
        soql_type: 'text',
        position: 16,
        input_schema_id: 945,
        id: 22293,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'y_coordinate'
      },
      {
        soql_type: 'text',
        position: 17,
        input_schema_id: 945,
        id: 22294,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'year'
      },
      {
        soql_type: 'text',
        position: 18,
        input_schema_id: 945,
        id: 22295,
        guessed_subtypes: [],
        guessed_soql_type: 'calendar_date',
        field_name: 'updated_on'
      },
      {
        soql_type: 'text',
        position: 19,
        input_schema_id: 945,
        id: 22296,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'latitude'
      },
      {
        soql_type: 'text',
        position: 20,
        input_schema_id: 945,
        id: 22297,
        guessed_subtypes: [],
        guessed_soql_type: 'number',
        field_name: 'longitude'
      },
      {
        soql_type: 'text',
        position: 21,
        input_schema_id: 945,
        id: 22298,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'location'
      }
    ],
    id: 945,
    created_by: {
      user_id: 'yczc-8men',
      email: 'brandon.webster@socrata.com',
      display_name: 'Brandon Webster'
    }
  },
  links: {
    transform: '/api/publishing/v1/source/823/schema/945',
    show: '/api/publishing/v1/source/823/schema/945',
    latest_output: '/api/publishing/v1/source/823/schema/945/output/latest'
  }
};

export const sourceShow = {
  resource: {
    schemas: [
      {
        total_rows: 9,
        output_schemas: [
          {
            output_columns: [
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22277
                    }
                  ],
                  transform_expr: 'to_number(`id`)',
                  output_soql_type: 'number',
                  id: 20799,
                  completed_at: null
                },
                position: 0,
                is_primary_key: false,
                id: 18133,
                field_name: 'id',
                display_name: 'ID',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22278
                    }
                  ],
                  transform_expr: '`case_number`',
                  output_soql_type: 'text',
                  id: 20800,
                  completed_at: null
                },
                position: 1,
                is_primary_key: false,
                id: 18134,
                field_name: 'case_number',
                display_name: 'Case Number',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22279
                    }
                  ],
                  transform_expr: 'to_floating_timestamp(`date`)',
                  output_soql_type: 'calendar_date',
                  id: 20801,
                  completed_at: null
                },
                position: 2,
                is_primary_key: false,
                id: 18135,
                field_name: 'date',
                display_name: 'Date',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22280
                    }
                  ],
                  transform_expr: '`block`',
                  output_soql_type: 'text',
                  id: 20802,
                  completed_at: null
                },
                position: 3,
                is_primary_key: false,
                id: 18136,
                field_name: 'block',
                display_name: 'Block',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22281
                    }
                  ],
                  transform_expr: '`iucr`',
                  output_soql_type: 'text',
                  id: 20803,
                  completed_at: null
                },
                position: 4,
                is_primary_key: false,
                id: 18137,
                field_name: 'iucr',
                display_name: 'IUCR',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22282
                    }
                  ],
                  transform_expr: '`primary_type`',
                  output_soql_type: 'text',
                  id: 20804,
                  completed_at: null
                },
                position: 5,
                is_primary_key: false,
                id: 18138,
                field_name: 'primary_type',
                display_name: 'Primary Type',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22283
                    }
                  ],
                  transform_expr: '`description`',
                  output_soql_type: 'text',
                  id: 20805,
                  completed_at: null
                },
                position: 6,
                is_primary_key: false,
                id: 18139,
                field_name: 'description',
                display_name: 'Description',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22284
                    }
                  ],
                  transform_expr: '`location_description`',
                  output_soql_type: 'text',
                  id: 20806,
                  completed_at: null
                },
                position: 7,
                is_primary_key: false,
                id: 18140,
                field_name: 'location_description',
                display_name: 'Location Description',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22285
                    }
                  ],
                  transform_expr: 'to_boolean(`arrest`)',
                  output_soql_type: 'checkbox',
                  id: 20807,
                  completed_at: null
                },
                position: 8,
                is_primary_key: false,
                id: 18141,
                field_name: 'arrest',
                display_name: 'Arrest',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22286
                    }
                  ],
                  transform_expr: 'to_boolean(`domestic`)',
                  output_soql_type: 'checkbox',
                  id: 20808,
                  completed_at: null
                },
                position: 9,
                is_primary_key: false,
                id: 18142,
                field_name: 'domestic',
                display_name: 'Domestic',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22287
                    }
                  ],
                  transform_expr: 'to_number(`beat`)',
                  output_soql_type: 'number',
                  id: 20809,
                  completed_at: null
                },
                position: 10,
                is_primary_key: false,
                id: 18143,
                field_name: 'beat',
                display_name: 'Beat',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22288
                    }
                  ],
                  transform_expr: 'to_number(`district`)',
                  output_soql_type: 'number',
                  id: 20810,
                  completed_at: null
                },
                position: 11,
                is_primary_key: false,
                id: 18144,
                field_name: 'district',
                display_name: 'District',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22289
                    }
                  ],
                  transform_expr: 'to_number(`ward`)',
                  output_soql_type: 'number',
                  id: 20811,
                  completed_at: null
                },
                position: 12,
                is_primary_key: false,
                id: 18145,
                field_name: 'ward',
                display_name: 'Ward',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22290
                    }
                  ],
                  transform_expr: 'to_number(`community_area`)',
                  output_soql_type: 'number',
                  id: 20812,
                  completed_at: null
                },
                position: 13,
                is_primary_key: false,
                id: 18146,
                field_name: 'community_area',
                display_name: 'Community Area',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22291
                    }
                  ],
                  transform_expr: '`fbi_code`',
                  output_soql_type: 'text',
                  id: 20813,
                  completed_at: null
                },
                position: 14,
                is_primary_key: false,
                id: 18147,
                field_name: 'fbi_code',
                display_name: 'FBI Code',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22292
                    }
                  ],
                  transform_expr: 'to_number(`x_coordinate`)',
                  output_soql_type: 'number',
                  id: 20814,
                  completed_at: null
                },
                position: 15,
                is_primary_key: false,
                id: 18148,
                field_name: 'x_coordinate',
                display_name: 'X Coordinate',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22293
                    }
                  ],
                  transform_expr: 'to_number(`y_coordinate`)',
                  output_soql_type: 'number',
                  id: 20815,
                  completed_at: null
                },
                position: 16,
                is_primary_key: false,
                id: 18149,
                field_name: 'y_coordinate',
                display_name: 'Y Coordinate',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22294
                    }
                  ],
                  transform_expr: 'to_number(`year`)',
                  output_soql_type: 'number',
                  id: 20816,
                  completed_at: null
                },
                position: 17,
                is_primary_key: false,
                id: 18150,
                field_name: 'year',
                display_name: 'Year',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22295
                    }
                  ],
                  transform_expr: 'to_floating_timestamp(`updated_on`)',
                  output_soql_type: 'calendar_date',
                  id: 20817,
                  completed_at: null
                },
                position: 18,
                is_primary_key: false,
                id: 18151,
                field_name: 'updated_on',
                display_name: 'Updated On',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22296
                    }
                  ],
                  transform_expr: 'to_number(`latitude`)',
                  output_soql_type: 'number',
                  id: 20818,
                  completed_at: null
                },
                position: 19,
                is_primary_key: false,
                id: 18152,
                field_name: 'latitude',
                display_name: 'Latitude',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22297
                    }
                  ],
                  transform_expr: 'to_number(`longitude`)',
                  output_soql_type: 'number',
                  id: 20819,
                  completed_at: null
                },
                position: 20,
                is_primary_key: false,
                id: 18153,
                field_name: 'longitude',
                display_name: 'Longitude',
                description: ''
              },
              {
                transform: {
                  transform_input_columns: [
                    {
                      input_column_id: 22298
                    }
                  ],
                  transform_expr: '`location`',
                  output_soql_type: 'text',
                  id: 20820,
                  completed_at: null
                },
                position: 21,
                is_primary_key: false,
                id: 18154,
                field_name: 'location',
                display_name: 'Location',
                description: ''
              }
            ],
            created_at: '2017-05-12T14:12:21.648593',
            input_schema_id: 945,
            id: 1145,
            error_count: 0,
            created_by: {
              user_id: 'yczc-8men',
              email: 'brandon.webster@socrata.com',
              display_name: 'Brandon Webster'
            },
            completed_at: null
          }
        ],
        name: null,
        created_at: '2017-05-12T14:12:09.412481',
        input_columns: [
          {
            soql_type: 'text',
            position: 0,
            input_schema_id: 945,
            id: 22277,
            guessed_subtypes: [],
            guessed_soql_type: 'number',
            field_name: 'id'
          },
          {
            soql_type: 'text',
            position: 1,
            input_schema_id: 945,
            id: 22278,
            guessed_subtypes: [],
            guessed_soql_type: 'text',
            field_name: 'case_number'
          },
          {
            soql_type: 'text',
            position: 2,
            input_schema_id: 945,
            id: 22279,
            guessed_subtypes: [],
            guessed_soql_type: 'calendar_date',
            field_name: 'date'
          },
          {
            soql_type: 'text',
            position: 3,
            input_schema_id: 945,
            id: 22280,
            guessed_subtypes: [],
            guessed_soql_type: 'text',
            field_name: 'block'
          },
          {
            soql_type: 'text',
            position: 4,
            input_schema_id: 945,
            id: 22281,
            guessed_subtypes: [],
            guessed_soql_type: 'text',
            field_name: 'iucr'
          },
          {
            soql_type: 'text',
            position: 5,
            input_schema_id: 945,
            id: 22282,
            guessed_subtypes: [],
            guessed_soql_type: 'text',
            field_name: 'primary_type'
          },
          {
            soql_type: 'text',
            position: 6,
            input_schema_id: 945,
            id: 22283,
            guessed_subtypes: [],
            guessed_soql_type: 'text',
            field_name: 'description'
          },
          {
            soql_type: 'text',
            position: 7,
            input_schema_id: 945,
            id: 22284,
            guessed_subtypes: [],
            guessed_soql_type: 'text',
            field_name: 'location_description'
          },
          {
            soql_type: 'text',
            position: 8,
            input_schema_id: 945,
            id: 22285,
            guessed_subtypes: [],
            guessed_soql_type: 'checkbox',
            field_name: 'arrest'
          },
          {
            soql_type: 'text',
            position: 9,
            input_schema_id: 945,
            id: 22286,
            guessed_subtypes: [],
            guessed_soql_type: 'checkbox',
            field_name: 'domestic'
          },
          {
            soql_type: 'text',
            position: 10,
            input_schema_id: 945,
            id: 22287,
            guessed_subtypes: [],
            guessed_soql_type: 'number',
            field_name: 'beat'
          },
          {
            soql_type: 'text',
            position: 11,
            input_schema_id: 945,
            id: 22288,
            guessed_subtypes: [],
            guessed_soql_type: 'number',
            field_name: 'district'
          },
          {
            soql_type: 'text',
            position: 12,
            input_schema_id: 945,
            id: 22289,
            guessed_subtypes: [],
            guessed_soql_type: 'number',
            field_name: 'ward'
          },
          {
            soql_type: 'text',
            position: 13,
            input_schema_id: 945,
            id: 22290,
            guessed_subtypes: [],
            guessed_soql_type: 'number',
            field_name: 'community_area'
          },
          {
            soql_type: 'text',
            position: 14,
            input_schema_id: 945,
            id: 22291,
            guessed_subtypes: [],
            guessed_soql_type: 'text',
            field_name: 'fbi_code'
          },
          {
            soql_type: 'text',
            position: 15,
            input_schema_id: 945,
            id: 22292,
            guessed_subtypes: [],
            guessed_soql_type: 'number',
            field_name: 'x_coordinate'
          },
          {
            soql_type: 'text',
            position: 16,
            input_schema_id: 945,
            id: 22293,
            guessed_subtypes: [],
            guessed_soql_type: 'number',
            field_name: 'y_coordinate'
          },
          {
            soql_type: 'text',
            position: 17,
            input_schema_id: 945,
            id: 22294,
            guessed_subtypes: [],
            guessed_soql_type: 'number',
            field_name: 'year'
          },
          {
            soql_type: 'text',
            position: 18,
            input_schema_id: 945,
            id: 22295,
            guessed_subtypes: [],
            guessed_soql_type: 'calendar_date',
            field_name: 'updated_on'
          },
          {
            soql_type: 'text',
            position: 19,
            input_schema_id: 945,
            id: 22296,
            guessed_subtypes: [],
            guessed_soql_type: 'number',
            field_name: 'latitude'
          },
          {
            soql_type: 'text',
            position: 20,
            input_schema_id: 945,
            id: 22297,
            guessed_subtypes: [],
            guessed_soql_type: 'number',
            field_name: 'longitude'
          },
          {
            soql_type: 'text',
            position: 21,
            input_schema_id: 945,
            id: 22298,
            guessed_subtypes: [],
            guessed_soql_type: 'text',
            field_name: 'location'
          }
        ],
        id: 945,
        created_by: {
          user_id: 'yczc-8men',
          email: 'brandon.webster@socrata.com',
          display_name: 'Brandon Webster'
        }
      }
    ],
    created_at: '2017-05-12T14:12:09.293177',
    id: 823,
    finished_at: '2017-05-12T14:12:22',
    source_type: {
      type: 'upload',
      filename: 'petty_crimes.csv'
    },
    failed_at: null,
    created_by: {
      user_id: 'yczc-8men',
      email: 'brandon.webster@socrata.com',
      display_name: 'Brandon Webster'
    },
    content_type: 'text/csv'
  },
  links: {
    show: '/api/publishing/v1/source/823',
    bytes: '/api/publishing/v1/source/823',
    add_to_revision: '/api/publishing/v1/source/823'
  }
};

export const newOutputSchemaFromDrop = {
  resource: {
    output_columns: [
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22278
            }
          ],
          transform_expr: '`case_number`',
          output_soql_type: 'text',
          id: 20800,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 1,
        is_primary_key: false,
        id: 18134,
        field_name: 'case_number',
        display_name: 'Case Number',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22279
            }
          ],
          transform_expr: 'to_floating_timestamp(`date`)',
          output_soql_type: 'calendar_date',
          id: 20801,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 2,
        is_primary_key: false,
        id: 18135,
        field_name: 'date',
        display_name: 'Date',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22280
            }
          ],
          transform_expr: '`block`',
          output_soql_type: 'text',
          id: 20802,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 3,
        is_primary_key: false,
        id: 18136,
        field_name: 'block',
        display_name: 'Block',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22281
            }
          ],
          transform_expr: '`iucr`',
          output_soql_type: 'text',
          id: 20803,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 4,
        is_primary_key: false,
        id: 18137,
        field_name: 'iucr',
        display_name: 'IUCR',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22282
            }
          ],
          transform_expr: '`primary_type`',
          output_soql_type: 'text',
          id: 20804,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 5,
        is_primary_key: false,
        id: 18138,
        field_name: 'primary_type',
        display_name: 'Primary Type',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22283
            }
          ],
          transform_expr: '`description`',
          output_soql_type: 'text',
          id: 20805,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 6,
        is_primary_key: false,
        id: 18139,
        field_name: 'description',
        display_name: 'Description',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22284
            }
          ],
          transform_expr: '`location_description`',
          output_soql_type: 'text',
          id: 20806,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 7,
        is_primary_key: false,
        id: 18140,
        field_name: 'location_description',
        display_name: 'Location Description',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22285
            }
          ],
          transform_expr: 'to_boolean(`arrest`)',
          output_soql_type: 'checkbox',
          id: 20807,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 8,
        is_primary_key: false,
        id: 18141,
        field_name: 'arrest',
        display_name: 'Arrest',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22286
            }
          ],
          transform_expr: 'to_boolean(`domestic`)',
          output_soql_type: 'checkbox',
          id: 20808,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 9,
        is_primary_key: false,
        id: 18142,
        field_name: 'domestic',
        display_name: 'Domestic',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22287
            }
          ],
          transform_expr: 'to_number(`beat`)',
          output_soql_type: 'number',
          id: 20809,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 10,
        is_primary_key: false,
        id: 18143,
        field_name: 'beat',
        display_name: 'Beat',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22288
            }
          ],
          transform_expr: 'to_number(`district`)',
          output_soql_type: 'number',
          id: 20810,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 11,
        is_primary_key: false,
        id: 18144,
        field_name: 'district',
        display_name: 'District',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22289
            }
          ],
          transform_expr: 'to_number(`ward`)',
          output_soql_type: 'number',
          id: 20811,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 12,
        is_primary_key: false,
        id: 18145,
        field_name: 'ward',
        display_name: 'Ward',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22290
            }
          ],
          transform_expr: 'to_number(`community_area`)',
          output_soql_type: 'number',
          id: 20812,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 13,
        is_primary_key: false,
        id: 18146,
        field_name: 'community_area',
        display_name: 'Community Area',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22291
            }
          ],
          transform_expr: '`fbi_code`',
          output_soql_type: 'text',
          id: 20813,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 14,
        is_primary_key: false,
        id: 18147,
        field_name: 'fbi_code',
        display_name: 'FBI Code',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22292
            }
          ],
          transform_expr: 'to_number(`x_coordinate`)',
          output_soql_type: 'number',
          id: 20814,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 15,
        is_primary_key: false,
        id: 18148,
        field_name: 'x_coordinate',
        display_name: 'X Coordinate',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22293
            }
          ],
          transform_expr: 'to_number(`y_coordinate`)',
          output_soql_type: 'number',
          id: 20815,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 16,
        is_primary_key: false,
        id: 18149,
        field_name: 'y_coordinate',
        display_name: 'Y Coordinate',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22294
            }
          ],
          transform_expr: 'to_number(`year`)',
          output_soql_type: 'number',
          id: 20816,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 17,
        is_primary_key: false,
        id: 18150,
        field_name: 'year',
        display_name: 'Year',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22295
            }
          ],
          transform_expr: 'to_floating_timestamp(`updated_on`)',
          output_soql_type: 'calendar_date',
          id: 20817,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 18,
        is_primary_key: false,
        id: 18151,
        field_name: 'updated_on',
        display_name: 'Updated On',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22296
            }
          ],
          transform_expr: 'to_number(`latitude`)',
          output_soql_type: 'number',
          id: 20818,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 19,
        is_primary_key: false,
        id: 18152,
        field_name: 'latitude',
        display_name: 'Latitude',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22297
            }
          ],
          transform_expr: 'to_number(`longitude`)',
          output_soql_type: 'number',
          id: 20819,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 20,
        is_primary_key: false,
        id: 18153,
        field_name: 'longitude',
        display_name: 'Longitude',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22298
            }
          ],
          transform_expr: '`location`',
          output_soql_type: 'text',
          id: 20820,
          completed_at: '2017-05-12T14:12:23'
        },
        position: 21,
        is_primary_key: false,
        id: 18154,
        field_name: 'location',
        display_name: 'Location',
        description: ''
      }
    ],
    created_at: '2017-05-12T14:18:55.922365',
    input_schema_id: 945,
    id: 1146,
    error_count: 0,
    created_by: {
      user_id: 'yczc-8men',
      email: 'brandon.webster@socrata.com',
      display_name: 'Brandon Webster'
    },
    completed_at: '2017-05-12T14:18:55'
  },
  links: {
    show: '/api/publishing/v1/source/823/schema/945/output/1146',
    rows: '/api/publishing/v1/source/823/schema/945/rows/1146'
  }
};

export const newOutputSchemaFromAdd = {
  resource: {
    output_columns: [
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22277
            }
          ],
          transform_expr: 'to_number(`id`)',
          output_soql_type: 'number',
          id: 20799,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 0,
        is_primary_key: false,
        id: 18133,
        field_name: 'id',
        display_name: 'ID',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22278
            }
          ],
          transform_expr: '`case_number`',
          output_soql_type: 'text',
          id: 20800,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 1,
        is_primary_key: false,
        id: 18134,
        field_name: 'case_number',
        display_name: 'Case Number',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22279
            }
          ],
          transform_expr: 'to_floating_timestamp(`date`)',
          output_soql_type: 'calendar_date',
          id: 20801,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 2,
        is_primary_key: false,
        id: 18135,
        field_name: 'date',
        display_name: 'Date',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22280
            }
          ],
          transform_expr: '`block`',
          output_soql_type: 'text',
          id: 20802,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 3,
        is_primary_key: false,
        id: 18136,
        field_name: 'block',
        display_name: 'Block',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22281
            }
          ],
          transform_expr: '`iucr`',
          output_soql_type: 'text',
          id: 20803,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 4,
        is_primary_key: false,
        id: 18137,
        field_name: 'iucr',
        display_name: 'IUCR',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22282
            }
          ],
          transform_expr: '`primary_type`',
          output_soql_type: 'text',
          id: 20804,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 5,
        is_primary_key: false,
        id: 18138,
        field_name: 'primary_type',
        display_name: 'Primary Type',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22283
            }
          ],
          transform_expr: '`description`',
          output_soql_type: 'text',
          id: 20805,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 6,
        is_primary_key: false,
        id: 18139,
        field_name: 'description',
        display_name: 'Description',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22284
            }
          ],
          transform_expr: '`location_description`',
          output_soql_type: 'text',
          id: 20806,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 7,
        is_primary_key: false,
        id: 18140,
        field_name: 'location_description',
        display_name: 'Location Description',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22285
            }
          ],
          transform_expr: 'to_boolean(`arrest`)',
          output_soql_type: 'checkbox',
          id: 20807,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 8,
        is_primary_key: false,
        id: 18141,
        field_name: 'arrest',
        display_name: 'Arrest',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22286
            }
          ],
          transform_expr: 'to_boolean(`domestic`)',
          output_soql_type: 'checkbox',
          id: 20808,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 9,
        is_primary_key: false,
        id: 18142,
        field_name: 'domestic',
        display_name: 'Domestic',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22287
            }
          ],
          transform_expr: 'to_number(`beat`)',
          output_soql_type: 'number',
          id: 20809,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 10,
        is_primary_key: false,
        id: 18143,
        field_name: 'beat',
        display_name: 'Beat',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22288
            }
          ],
          transform_expr: 'to_number(`district`)',
          output_soql_type: 'number',
          id: 20810,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 11,
        is_primary_key: false,
        id: 18144,
        field_name: 'district',
        display_name: 'District',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22289
            }
          ],
          transform_expr: 'to_number(`ward`)',
          output_soql_type: 'number',
          id: 20811,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 12,
        is_primary_key: false,
        id: 18145,
        field_name: 'ward',
        display_name: 'Ward',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22290
            }
          ],
          transform_expr: 'to_number(`community_area`)',
          output_soql_type: 'number',
          id: 20812,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 13,
        is_primary_key: false,
        id: 18146,
        field_name: 'community_area',
        display_name: 'Community Area',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22291
            }
          ],
          transform_expr: '`fbi_code`',
          output_soql_type: 'text',
          id: 20813,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 14,
        is_primary_key: false,
        id: 18147,
        field_name: 'fbi_code',
        display_name: 'FBI Code',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22292
            }
          ],
          transform_expr: 'to_number(`x_coordinate`)',
          output_soql_type: 'number',
          id: 20814,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 15,
        is_primary_key: false,
        id: 18148,
        field_name: 'x_coordinate',
        display_name: 'X Coordinate',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22293
            }
          ],
          transform_expr: 'to_number(`y_coordinate`)',
          output_soql_type: 'number',
          id: 20815,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 16,
        is_primary_key: false,
        id: 18149,
        field_name: 'y_coordinate',
        display_name: 'Y Coordinate',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22294
            }
          ],
          transform_expr: 'to_number(`year`)',
          output_soql_type: 'number',
          id: 20816,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 17,
        is_primary_key: false,
        id: 18150,
        field_name: 'year',
        display_name: 'Year',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22295
            }
          ],
          transform_expr: 'to_floating_timestamp(`updated_on`)',
          output_soql_type: 'calendar_date',
          id: 20817,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 18,
        is_primary_key: false,
        id: 18151,
        field_name: 'updated_on',
        display_name: 'Updated On',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22296
            }
          ],
          transform_expr: 'to_number(`latitude`)',
          output_soql_type: 'number',
          id: 20818,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 19,
        is_primary_key: false,
        id: 18152,
        field_name: 'latitude',
        display_name: 'Latitude',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22297
            }
          ],
          transform_expr: 'to_number(`longitude`)',
          output_soql_type: 'number',
          id: 20819,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 20,
        is_primary_key: false,
        id: 18153,
        field_name: 'longitude',
        display_name: 'Longitude',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22298
            }
          ],
          transform_expr: '`location`',
          output_soql_type: 'text',
          id: 20820,
          completed_at: '2017-05-12T14:12:23'
        },
        position: 21,
        is_primary_key: false,
        id: 18154,
        field_name: 'location',
        display_name: 'Location',
        description: ''
      }
    ],
    created_at: '2017-05-12T14:20:36.697703',
    input_schema_id: 945,
    id: 1147,
    error_count: 0,
    created_by: {
      user_id: 'yczc-8men',
      email: 'brandon.webster@socrata.com',
      display_name: 'Brandon Webster'
    },
    completed_at: '2017-05-12T14:20:36'
  },
  links: {
    show: '/api/publishing/v1/source/823/schema/945/output/1147',
    rows: '/api/publishing/v1/source/823/schema/945/rows/1147'
  }
};

export const newOutputSchemaFromTypeChange = {
  resource: {
    output_columns: [
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22277
            }
          ],
          transform_expr: 'to_text(id)',
          output_soql_type: 'text',
          id: 20821,
          completed_at: null
        },
        position: 0,
        is_primary_key: false,
        id: 18155,
        field_name: 'id',
        display_name: 'ID',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22278
            }
          ],
          transform_expr: '`case_number`',
          output_soql_type: 'text',
          id: 20800,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 1,
        is_primary_key: false,
        id: 18134,
        field_name: 'case_number',
        display_name: 'Case Number',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22279
            }
          ],
          transform_expr: 'to_floating_timestamp(`date`)',
          output_soql_type: 'calendar_date',
          id: 20801,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 2,
        is_primary_key: false,
        id: 18135,
        field_name: 'date',
        display_name: 'Date',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22280
            }
          ],
          transform_expr: '`block`',
          output_soql_type: 'text',
          id: 20802,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 3,
        is_primary_key: false,
        id: 18136,
        field_name: 'block',
        display_name: 'Block',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22281
            }
          ],
          transform_expr: '`iucr`',
          output_soql_type: 'text',
          id: 20803,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 4,
        is_primary_key: false,
        id: 18137,
        field_name: 'iucr',
        display_name: 'IUCR',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22282
            }
          ],
          transform_expr: '`primary_type`',
          output_soql_type: 'text',
          id: 20804,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 5,
        is_primary_key: false,
        id: 18138,
        field_name: 'primary_type',
        display_name: 'Primary Type',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22283
            }
          ],
          transform_expr: '`description`',
          output_soql_type: 'text',
          id: 20805,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 6,
        is_primary_key: false,
        id: 18139,
        field_name: 'description',
        display_name: 'Description',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22284
            }
          ],
          transform_expr: '`location_description`',
          output_soql_type: 'text',
          id: 20806,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 7,
        is_primary_key: false,
        id: 18140,
        field_name: 'location_description',
        display_name: 'Location Description',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22285
            }
          ],
          transform_expr: 'to_boolean(`arrest`)',
          output_soql_type: 'checkbox',
          id: 20807,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 8,
        is_primary_key: false,
        id: 18141,
        field_name: 'arrest',
        display_name: 'Arrest',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22286
            }
          ],
          transform_expr: 'to_boolean(`domestic`)',
          output_soql_type: 'checkbox',
          id: 20808,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 9,
        is_primary_key: false,
        id: 18142,
        field_name: 'domestic',
        display_name: 'Domestic',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22287
            }
          ],
          transform_expr: 'to_number(`beat`)',
          output_soql_type: 'number',
          id: 20809,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 10,
        is_primary_key: false,
        id: 18143,
        field_name: 'beat',
        display_name: 'Beat',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22288
            }
          ],
          transform_expr: 'to_number(`district`)',
          output_soql_type: 'number',
          id: 20810,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 11,
        is_primary_key: false,
        id: 18144,
        field_name: 'district',
        display_name: 'District',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22289
            }
          ],
          transform_expr: 'to_number(`ward`)',
          output_soql_type: 'number',
          id: 20811,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 12,
        is_primary_key: false,
        id: 18145,
        field_name: 'ward',
        display_name: 'Ward',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22290
            }
          ],
          transform_expr: 'to_number(`community_area`)',
          output_soql_type: 'number',
          id: 20812,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 13,
        is_primary_key: false,
        id: 18146,
        field_name: 'community_area',
        display_name: 'Community Area',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22291
            }
          ],
          transform_expr: '`fbi_code`',
          output_soql_type: 'text',
          id: 20813,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 14,
        is_primary_key: false,
        id: 18147,
        field_name: 'fbi_code',
        display_name: 'FBI Code',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22292
            }
          ],
          transform_expr: 'to_number(`x_coordinate`)',
          output_soql_type: 'number',
          id: 20814,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 15,
        is_primary_key: false,
        id: 18148,
        field_name: 'x_coordinate',
        display_name: 'X Coordinate',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22293
            }
          ],
          transform_expr: 'to_number(`y_coordinate`)',
          output_soql_type: 'number',
          id: 20815,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 16,
        is_primary_key: false,
        id: 18149,
        field_name: 'y_coordinate',
        display_name: 'Y Coordinate',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22294
            }
          ],
          transform_expr: 'to_number(`year`)',
          output_soql_type: 'number',
          id: 20816,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 17,
        is_primary_key: false,
        id: 18150,
        field_name: 'year',
        display_name: 'Year',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22295
            }
          ],
          transform_expr: 'to_floating_timestamp(`updated_on`)',
          output_soql_type: 'calendar_date',
          id: 20817,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 18,
        is_primary_key: false,
        id: 18151,
        field_name: 'updated_on',
        display_name: 'Updated On',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22296
            }
          ],
          transform_expr: 'to_number(`latitude`)',
          output_soql_type: 'number',
          id: 20818,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 19,
        is_primary_key: false,
        id: 18152,
        field_name: 'latitude',
        display_name: 'Latitude',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22297
            }
          ],
          transform_expr: 'to_number(`longitude`)',
          output_soql_type: 'number',
          id: 20819,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 20,
        is_primary_key: false,
        id: 18153,
        field_name: 'longitude',
        display_name: 'Longitude',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22298
            }
          ],
          transform_expr: '`location`',
          output_soql_type: 'text',
          id: 20820,
          completed_at: '2017-05-12T14:12:23'
        },
        position: 21,
        is_primary_key: false,
        id: 18154,
        field_name: 'location',
        display_name: 'Location',
        description: ''
      }
    ],
    created_at: '2017-05-12T14:21:45.479100',
    input_schema_id: 945,
    id: 1148,
    error_count: 0,
    created_by: {
      user_id: 'yczc-8men',
      email: 'brandon.webster@socrata.com',
      display_name: 'Brandon Webster'
    },
    completed_at: null
  },
  links: {
    show: '/api/publishing/v1/source/823/schema/945/output/1148',
    rows: '/api/publishing/v1/source/823/schema/945/rows/1148'
  }
};

export const newOutputSchemaFromSetPrimary = {
  resource: {
    output_columns: [
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22277
            }
          ],
          transform_expr: 'to_text(id)',
          output_soql_type: 'text',
          id: 20821,
          completed_at: '2017-05-12T14:21:46'
        },
        position: 0,
        is_primary_key: false,
        id: 18155,
        field_name: 'id',
        display_name: 'ID',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22278
            }
          ],
          transform_expr: '`case_number`',
          output_soql_type: 'text',
          id: 20800,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 1,
        is_primary_key: true,
        id: 18134,
        field_name: 'case_number',
        display_name: 'Case Number',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22279
            }
          ],
          transform_expr: 'to_floating_timestamp(`date`)',
          output_soql_type: 'calendar_date',
          id: 20801,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 2,
        is_primary_key: false,
        id: 18135,
        field_name: 'date',
        display_name: 'Date',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22280
            }
          ],
          transform_expr: '`block`',
          output_soql_type: 'text',
          id: 20802,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 3,
        is_primary_key: false,
        id: 18136,
        field_name: 'block',
        display_name: 'Block',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22281
            }
          ],
          transform_expr: '`iucr`',
          output_soql_type: 'text',
          id: 20803,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 4,
        is_primary_key: false,
        id: 18137,
        field_name: 'iucr',
        display_name: 'IUCR',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22282
            }
          ],
          transform_expr: '`primary_type`',
          output_soql_type: 'text',
          id: 20804,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 5,
        is_primary_key: false,
        id: 18138,
        field_name: 'primary_type',
        display_name: 'Primary Type',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22283
            }
          ],
          transform_expr: '`description`',
          output_soql_type: 'text',
          id: 20805,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 6,
        is_primary_key: false,
        id: 18139,
        field_name: 'description',
        display_name: 'Description',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22284
            }
          ],
          transform_expr: '`location_description`',
          output_soql_type: 'text',
          id: 20806,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 7,
        is_primary_key: false,
        id: 18140,
        field_name: 'location_description',
        display_name: 'Location Description',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22285
            }
          ],
          transform_expr: 'to_boolean(`arrest`)',
          output_soql_type: 'checkbox',
          id: 20807,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 8,
        is_primary_key: false,
        id: 18141,
        field_name: 'arrest',
        display_name: 'Arrest',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22286
            }
          ],
          transform_expr: 'to_boolean(`domestic`)',
          output_soql_type: 'checkbox',
          id: 20808,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 9,
        is_primary_key: false,
        id: 18142,
        field_name: 'domestic',
        display_name: 'Domestic',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22287
            }
          ],
          transform_expr: 'to_number(`beat`)',
          output_soql_type: 'number',
          id: 20809,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 10,
        is_primary_key: false,
        id: 18143,
        field_name: 'beat',
        display_name: 'Beat',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22288
            }
          ],
          transform_expr: 'to_number(`district`)',
          output_soql_type: 'number',
          id: 20810,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 11,
        is_primary_key: false,
        id: 18144,
        field_name: 'district',
        display_name: 'District',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22289
            }
          ],
          transform_expr: 'to_number(`ward`)',
          output_soql_type: 'number',
          id: 20811,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 12,
        is_primary_key: false,
        id: 18145,
        field_name: 'ward',
        display_name: 'Ward',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22290
            }
          ],
          transform_expr: 'to_number(`community_area`)',
          output_soql_type: 'number',
          id: 20812,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 13,
        is_primary_key: false,
        id: 18146,
        field_name: 'community_area',
        display_name: 'Community Area',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22291
            }
          ],
          transform_expr: '`fbi_code`',
          output_soql_type: 'text',
          id: 20813,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 14,
        is_primary_key: false,
        id: 18147,
        field_name: 'fbi_code',
        display_name: 'FBI Code',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22292
            }
          ],
          transform_expr: 'to_number(`x_coordinate`)',
          output_soql_type: 'number',
          id: 20814,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 15,
        is_primary_key: false,
        id: 18148,
        field_name: 'x_coordinate',
        display_name: 'X Coordinate',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22293
            }
          ],
          transform_expr: 'to_number(`y_coordinate`)',
          output_soql_type: 'number',
          id: 20815,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 16,
        is_primary_key: false,
        id: 18149,
        field_name: 'y_coordinate',
        display_name: 'Y Coordinate',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22294
            }
          ],
          transform_expr: 'to_number(`year`)',
          output_soql_type: 'number',
          id: 20816,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 17,
        is_primary_key: false,
        id: 18150,
        field_name: 'year',
        display_name: 'Year',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22295
            }
          ],
          transform_expr: 'to_floating_timestamp(`updated_on`)',
          output_soql_type: 'calendar_date',
          id: 20817,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 18,
        is_primary_key: false,
        id: 18151,
        field_name: 'updated_on',
        display_name: 'Updated On',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22296
            }
          ],
          transform_expr: 'to_number(`latitude`)',
          output_soql_type: 'number',
          id: 20818,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 19,
        is_primary_key: false,
        id: 18152,
        field_name: 'latitude',
        display_name: 'Latitude',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22297
            }
          ],
          transform_expr: 'to_number(`longitude`)',
          output_soql_type: 'number',
          id: 20819,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 20,
        is_primary_key: false,
        id: 18153,
        field_name: 'longitude',
        display_name: 'Longitude',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22298
            }
          ],
          transform_expr: '`location`',
          output_soql_type: 'text',
          id: 20820,
          completed_at: '2017-05-12T14:12:23'
        },
        position: 21,
        is_primary_key: false,
        id: 18154,
        field_name: 'location',
        display_name: 'Location',
        description: ''
      }
    ],
    created_at: '2017-05-12T14:22:23.275188',
    input_schema_id: 945,
    id: 1149,
    error_count: 0,
    created_by: {
      user_id: 'yczc-8men',
      email: 'brandon.webster@socrata.com',
      display_name: 'Brandon Webster'
    },
    completed_at: '2017-05-12T14:22:23'
  },
  links: {
    show: '/api/publishing/v1/source/823/schema/945/output/1149',
    rows: '/api/publishing/v1/source/823/schema/945/rows/1149'
  }
};

export const rows = [
  {
    output_columns: [
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22277
            }
          ],
          transform_expr: 'to_text(id)',
          output_soql_type: 'text',
          id: 20821,
          completed_at: '2017-05-12T14:21:46'
        },
        position: 0,
        is_primary_key: false,
        id: 18155,
        field_name: 'id',
        display_name: 'ID',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22278
            }
          ],
          transform_expr: 'to_boolean(case_number)',
          output_soql_type: 'checkbox',
          id: 20822,
          completed_at: '2017-05-12T14:23:20'
        },
        position: 1,
        is_primary_key: true,
        id: 18156,
        field_name: 'case_number',
        display_name: 'Case Number',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22279
            }
          ],
          transform_expr: 'to_floating_timestamp(`date`)',
          output_soql_type: 'calendar_date',
          id: 20801,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 2,
        is_primary_key: false,
        id: 18135,
        field_name: 'date',
        display_name: 'Date',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22280
            }
          ],
          transform_expr: '`block`',
          output_soql_type: 'text',
          id: 20802,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 3,
        is_primary_key: false,
        id: 18136,
        field_name: 'block',
        display_name: 'Block',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22281
            }
          ],
          transform_expr: '`iucr`',
          output_soql_type: 'text',
          id: 20803,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 4,
        is_primary_key: false,
        id: 18137,
        field_name: 'iucr',
        display_name: 'IUCR',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22282
            }
          ],
          transform_expr: '`primary_type`',
          output_soql_type: 'text',
          id: 20804,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 5,
        is_primary_key: false,
        id: 18138,
        field_name: 'primary_type',
        display_name: 'Primary Type',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22283
            }
          ],
          transform_expr: '`description`',
          output_soql_type: 'text',
          id: 20805,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 6,
        is_primary_key: false,
        id: 18139,
        field_name: 'description',
        display_name: 'Description',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22284
            }
          ],
          transform_expr: '`location_description`',
          output_soql_type: 'text',
          id: 20806,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 7,
        is_primary_key: false,
        id: 18140,
        field_name: 'location_description',
        display_name: 'Location Description',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22285
            }
          ],
          transform_expr: 'to_boolean(`arrest`)',
          output_soql_type: 'checkbox',
          id: 20807,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 8,
        is_primary_key: false,
        id: 18141,
        field_name: 'arrest',
        display_name: 'Arrest',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22286
            }
          ],
          transform_expr: 'to_boolean(`domestic`)',
          output_soql_type: 'checkbox',
          id: 20808,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 9,
        is_primary_key: false,
        id: 18142,
        field_name: 'domestic',
        display_name: 'Domestic',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22287
            }
          ],
          transform_expr: 'to_number(`beat`)',
          output_soql_type: 'number',
          id: 20809,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 10,
        is_primary_key: false,
        id: 18143,
        field_name: 'beat',
        display_name: 'Beat',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22288
            }
          ],
          transform_expr: 'to_number(`district`)',
          output_soql_type: 'number',
          id: 20810,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 11,
        is_primary_key: false,
        id: 18144,
        field_name: 'district',
        display_name: 'District',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22289
            }
          ],
          transform_expr: 'to_number(`ward`)',
          output_soql_type: 'number',
          id: 20811,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 12,
        is_primary_key: false,
        id: 18145,
        field_name: 'ward',
        display_name: 'Ward',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22290
            }
          ],
          transform_expr: 'to_number(`community_area`)',
          output_soql_type: 'number',
          id: 20812,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 13,
        is_primary_key: false,
        id: 18146,
        field_name: 'community_area',
        display_name: 'Community Area',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22291
            }
          ],
          transform_expr: '`fbi_code`',
          output_soql_type: 'text',
          id: 20813,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 14,
        is_primary_key: false,
        id: 18147,
        field_name: 'fbi_code',
        display_name: 'FBI Code',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22292
            }
          ],
          transform_expr: 'to_number(`x_coordinate`)',
          output_soql_type: 'number',
          id: 20814,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 15,
        is_primary_key: false,
        id: 18148,
        field_name: 'x_coordinate',
        display_name: 'X Coordinate',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22293
            }
          ],
          transform_expr: 'to_number(`y_coordinate`)',
          output_soql_type: 'number',
          id: 20815,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 16,
        is_primary_key: false,
        id: 18149,
        field_name: 'y_coordinate',
        display_name: 'Y Coordinate',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22294
            }
          ],
          transform_expr: 'to_number(`year`)',
          output_soql_type: 'number',
          id: 20816,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 17,
        is_primary_key: false,
        id: 18150,
        field_name: 'year',
        display_name: 'Year',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22295
            }
          ],
          transform_expr: 'to_floating_timestamp(`updated_on`)',
          output_soql_type: 'calendar_date',
          id: 20817,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 18,
        is_primary_key: false,
        id: 18151,
        field_name: 'updated_on',
        display_name: 'Updated On',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22296
            }
          ],
          transform_expr: 'to_number(`latitude`)',
          output_soql_type: 'number',
          id: 20818,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 19,
        is_primary_key: false,
        id: 18152,
        field_name: 'latitude',
        display_name: 'Latitude',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22297
            }
          ],
          transform_expr: 'to_number(`longitude`)',
          output_soql_type: 'number',
          id: 20819,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 20,
        is_primary_key: false,
        id: 18153,
        field_name: 'longitude',
        display_name: 'Longitude',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22298
            }
          ],
          transform_expr: '`location`',
          output_soql_type: 'text',
          id: 20820,
          completed_at: '2017-05-12T14:12:23'
        },
        position: 21,
        is_primary_key: false,
        id: 18154,
        field_name: 'location',
        display_name: 'Location',
        description: ''
      }
    ],
    created_at: '2017-05-12T14:23:20.690934',
    input_schema_id: 945,
    id: 1150,
    error_count: 9,
    created_by: {
      user_id: 'yczc-8men',
      email: 'brandon.webster@socrata.com',
      display_name: 'Brandon Webster'
    },
    completed_at: '2017-05-12T14:23:20'
  },
  {
    row: [
      {
        ok: '10376594'
      },
      {
        error: {
          message: 'Failed to convert "HZ112917" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112917'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:53:00.000'
      },
      {
        ok: '004XX S LARAMIE AVE'
      },
      {
        ok: '031A'
      },
      {
        ok: 'ROBBERY'
      },
      {
        ok: 'ARMED: HANDGUN'
      },
      {
        ok: 'SIDEWALK'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '1522'
      },
      {
        ok: '15'
      },
      {
        ok: '29'
      },
      {
        ok: '25'
      },
      {
        ok: '3'
      },
      {
        ok: '1141799'
      },
      {
        ok: '1897396'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.87452002'
      },
      {
        ok: '-87.75484623'
      },
      {
        ok: '(41.874520022, -87.754846231)'
      }
    ],
    offset: 0
  },
  {
    row: [
      {
        ok: '10376574'
      },
      {
        error: {
          message: 'Failed to convert "HZ112920" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112920'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:45:00.000'
      },
      {
        ok: '003XX N CENTRAL AVE'
      },
      {
        ok: '031A'
      },
      {
        ok: 'ROBBERY'
      },
      {
        ok: 'ARMED: HANDGUN'
      },
      {
        ok: 'STREET'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '1523'
      },
      {
        ok: '15'
      },
      {
        ok: '28'
      },
      {
        ok: '25'
      },
      {
        ok: '3'
      },
      {
        ok: '1138978'
      },
      {
        ok: '1901836'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.88675567'
      },
      {
        ok: '-87.76509592'
      },
      {
        ok: '(41.886755667, -87.765095923)'
      }
    ],
    offset: 1
  },
  {
    row: [
      {
        ok: '10376371'
      },
      {
        error: {
          message: 'Failed to convert "HZ112605" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112605'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:30:00.000'
      },
      {
        ok: '004XX E 48TH ST'
      },
      {
        ok: '910'
      },
      {
        ok: 'MOTOR VEHICLE THEFT'
      },
      {
        ok: 'AUTOMOBILE'
      },
      {
        ok: 'STREET'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '223'
      },
      {
        ok: '2'
      },
      {
        ok: '3'
      },
      {
        ok: '38'
      },
      {
        ok: '7'
      },
      {
        ok: '1180055'
      },
      {
        ok: '1873293'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.80758633'
      },
      {
        ok: '-87.61512779'
      },
      {
        ok: '(41.807586328, -87.615127788)'
      }
    ],
    offset: 2
  },
  {
    row: [
      {
        ok: '10380234'
      },
      {
        error: {
          message: 'Failed to convert "HZ116304" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ116304'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:30:00.000'
      },
      {
        ok: '055XX S CORNELL AVE'
      },
      {
        ok: '910'
      },
      {
        ok: 'MOTOR VEHICLE THEFT'
      },
      {
        ok: 'AUTOMOBILE'
      },
      {
        ok: 'STREET'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '235'
      },
      {
        ok: '2'
      },
      {
        ok: '5'
      },
      {
        ok: '41'
      },
      {
        ok: '7'
      },
      {
        ok: '1188201'
      },
      {
        ok: '1868688'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.7947592'
      },
      {
        ok: '-87.58539793'
      },
      {
        ok: '(41.794759204, -87.585397931)'
      }
    ],
    offset: 3
  },
  {
    row: [
      {
        ok: '10375856'
      },
      {
        error: {
          message: 'Failed to convert "HZ112435" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112435'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:30:00.000'
      },
      {
        ok: '001XX S CENTRAL AVE'
      },
      {
        ok: '560'
      },
      {
        ok: 'ASSAULT'
      },
      {
        ok: 'SIMPLE'
      },
      {
        ok: 'RESIDENCE'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '1522'
      },
      {
        ok: '15'
      },
      {
        ok: '29'
      },
      {
        ok: '25'
      },
      {
        ok: '08A'
      },
      {
        ok: '1139082'
      },
      {
        ok: '1898717'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.87819484'
      },
      {
        ok: '-87.76478988'
      },
      {
        ok: '(41.878194837, -87.764789883)'
      }
    ],
    offset: 4
  },
  {
    row: [
      {
        ok: '10375836'
      },
      {
        error: {
          message: 'Failed to convert "HZ112407" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112407'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:25:00.000'
      },
      {
        ok: '063XX S KEDZIE AVE'
      },
      {
        ok: '1330'
      },
      {
        ok: 'CRIMINAL TRESPASS'
      },
      {
        ok: 'TO LAND'
      },
      {
        ok: 'DRUG STORE'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '823'
      },
      {
        ok: '8'
      },
      {
        ok: '15'
      },
      {
        ok: '66'
      },
      {
        ok: '26'
      },
      {
        ok: '1156143'
      },
      {
        ok: '1862448'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.77834098'
      },
      {
        ok: '-87.70312224'
      },
      {
        ok: '(41.778340981, -87.703122242)'
      }
    ],
    offset: 5
  },
  {
    row: [
      {
        ok: '10376791'
      },
      {
        error: {
          message: 'Failed to convert "HZ112953" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112953'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:20:00.000'
      },
      {
        ok: '004XX W 76TH ST'
      },
      {
        ok: '031A'
      },
      {
        ok: 'ROBBERY'
      },
      {
        ok: 'ARMED: HANDGUN'
      },
      {
        ok: 'OTHER'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '621'
      },
      {
        ok: '6'
      },
      {
        ok: '17'
      },
      {
        ok: '69'
      },
      {
        ok: '3'
      },
      {
        ok: '1174859'
      },
      {
        ok: '1854542'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.75624913'
      },
      {
        ok: '-87.63474388'
      },
      {
        ok: '(41.756249125, -87.634743877)'
      }
    ],
    offset: 6
  },
  {
    row: [
      {
        ok: '10375849'
      },
      {
        error: {
          message: 'Failed to convert "HZ112411" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112411'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:15:00.000'
      },
      {
        ok: '024XX N NARRAGANSETT AVE'
      },
      {
        ok: '460'
      },
      {
        ok: 'BATTERY'
      },
      {
        ok: 'SIMPLE'
      },
      {
        ok: 'ATHLETIC CLUB'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '2512'
      },
      {
        ok: '25'
      },
      {
        ok: '36'
      },
      {
        ok: '19'
      },
      {
        ok: '08B'
      },
      {
        ok: '1133346'
      },
      {
        ok: '1915440'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.92418726'
      },
      {
        ok: '-87.7854594'
      },
      {
        ok: '(41.924187262, -87.785459395)'
      }
    ],
    offset: 7
  },
  {
    row: [
      {
        ok: '10376251'
      },
      {
        error: {
          message: 'Failed to convert "HZ112670" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112670'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:15:00.000'
      },
      {
        ok: '037XX W FLOURNOY ST'
      },
      {
        ok: '820'
      },
      {
        ok: 'THEFT'
      },
      {
        ok: '$500 AND UNDER'
      },
      {
        ok: 'STREET'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '1133'
      },
      {
        ok: '11'
      },
      {
        ok: '24'
      },
      {
        ok: '27'
      },
      {
        ok: '6'
      },
      {
        ok: '1151652'
      },
      {
        ok: '1896775'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.87262801'
      },
      {
        ok: '-87.71868635'
      },
      {
        ok: '(41.872628006, -87.718686345)'
      }
    ],
    offset: 8
  }
];

export const columnErrors = [
  {
    output_columns: [
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22277
            }
          ],
          transform_expr: 'to_text(id)',
          output_soql_type: 'text',
          id: 20821,
          completed_at: '2017-05-12T14:21:46'
        },
        position: 0,
        is_primary_key: false,
        id: 18155,
        field_name: 'id',
        display_name: 'ID',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22278
            }
          ],
          transform_expr: 'to_boolean(case_number)',
          output_soql_type: 'checkbox',
          id: 20822,
          completed_at: '2017-05-12T14:23:20'
        },
        position: 1,
        is_primary_key: true,
        id: 18156,
        field_name: 'case_number',
        display_name: 'Case Number',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22279
            }
          ],
          transform_expr: 'to_floating_timestamp(`date`)',
          output_soql_type: 'calendar_date',
          id: 20801,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 2,
        is_primary_key: false,
        id: 18135,
        field_name: 'date',
        display_name: 'Date',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22280
            }
          ],
          transform_expr: '`block`',
          output_soql_type: 'text',
          id: 20802,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 3,
        is_primary_key: false,
        id: 18136,
        field_name: 'block',
        display_name: 'Block',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22281
            }
          ],
          transform_expr: '`iucr`',
          output_soql_type: 'text',
          id: 20803,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 4,
        is_primary_key: false,
        id: 18137,
        field_name: 'iucr',
        display_name: 'IUCR',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22282
            }
          ],
          transform_expr: '`primary_type`',
          output_soql_type: 'text',
          id: 20804,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 5,
        is_primary_key: false,
        id: 18138,
        field_name: 'primary_type',
        display_name: 'Primary Type',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22283
            }
          ],
          transform_expr: '`description`',
          output_soql_type: 'text',
          id: 20805,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 6,
        is_primary_key: false,
        id: 18139,
        field_name: 'description',
        display_name: 'Description',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22284
            }
          ],
          transform_expr: '`location_description`',
          output_soql_type: 'text',
          id: 20806,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 7,
        is_primary_key: false,
        id: 18140,
        field_name: 'location_description',
        display_name: 'Location Description',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22285
            }
          ],
          transform_expr: 'to_boolean(`arrest`)',
          output_soql_type: 'checkbox',
          id: 20807,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 8,
        is_primary_key: false,
        id: 18141,
        field_name: 'arrest',
        display_name: 'Arrest',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22286
            }
          ],
          transform_expr: 'to_boolean(`domestic`)',
          output_soql_type: 'checkbox',
          id: 20808,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 9,
        is_primary_key: false,
        id: 18142,
        field_name: 'domestic',
        display_name: 'Domestic',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22287
            }
          ],
          transform_expr: 'to_number(`beat`)',
          output_soql_type: 'number',
          id: 20809,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 10,
        is_primary_key: false,
        id: 18143,
        field_name: 'beat',
        display_name: 'Beat',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22288
            }
          ],
          transform_expr: 'to_number(`district`)',
          output_soql_type: 'number',
          id: 20810,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 11,
        is_primary_key: false,
        id: 18144,
        field_name: 'district',
        display_name: 'District',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22289
            }
          ],
          transform_expr: 'to_number(`ward`)',
          output_soql_type: 'number',
          id: 20811,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 12,
        is_primary_key: false,
        id: 18145,
        field_name: 'ward',
        display_name: 'Ward',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22290
            }
          ],
          transform_expr: 'to_number(`community_area`)',
          output_soql_type: 'number',
          id: 20812,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 13,
        is_primary_key: false,
        id: 18146,
        field_name: 'community_area',
        display_name: 'Community Area',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22291
            }
          ],
          transform_expr: '`fbi_code`',
          output_soql_type: 'text',
          id: 20813,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 14,
        is_primary_key: false,
        id: 18147,
        field_name: 'fbi_code',
        display_name: 'FBI Code',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22292
            }
          ],
          transform_expr: 'to_number(`x_coordinate`)',
          output_soql_type: 'number',
          id: 20814,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 15,
        is_primary_key: false,
        id: 18148,
        field_name: 'x_coordinate',
        display_name: 'X Coordinate',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22293
            }
          ],
          transform_expr: 'to_number(`y_coordinate`)',
          output_soql_type: 'number',
          id: 20815,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 16,
        is_primary_key: false,
        id: 18149,
        field_name: 'y_coordinate',
        display_name: 'Y Coordinate',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22294
            }
          ],
          transform_expr: 'to_number(`year`)',
          output_soql_type: 'number',
          id: 20816,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 17,
        is_primary_key: false,
        id: 18150,
        field_name: 'year',
        display_name: 'Year',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22295
            }
          ],
          transform_expr: 'to_floating_timestamp(`updated_on`)',
          output_soql_type: 'calendar_date',
          id: 20817,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 18,
        is_primary_key: false,
        id: 18151,
        field_name: 'updated_on',
        display_name: 'Updated On',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22296
            }
          ],
          transform_expr: 'to_number(`latitude`)',
          output_soql_type: 'number',
          id: 20818,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 19,
        is_primary_key: false,
        id: 18152,
        field_name: 'latitude',
        display_name: 'Latitude',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22297
            }
          ],
          transform_expr: 'to_number(`longitude`)',
          output_soql_type: 'number',
          id: 20819,
          completed_at: '2017-05-12T14:12:22'
        },
        position: 20,
        is_primary_key: false,
        id: 18153,
        field_name: 'longitude',
        display_name: 'Longitude',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 22298
            }
          ],
          transform_expr: '`location`',
          output_soql_type: 'text',
          id: 20820,
          completed_at: '2017-05-12T14:12:23'
        },
        position: 21,
        is_primary_key: false,
        id: 18154,
        field_name: 'location',
        display_name: 'Location',
        description: ''
      }
    ],
    created_at: '2017-05-12T14:23:20.690934',
    input_schema_id: 945,
    id: 1150,
    error_count: 9,
    created_by: {
      user_id: 'yczc-8men',
      email: 'brandon.webster@socrata.com',
      display_name: 'Brandon Webster'
    },
    completed_at: '2017-05-12T14:23:20'
  },
  {
    row: [
      {
        ok: '10376594'
      },
      {
        error: {
          message: 'Failed to convert "HZ112917" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112917'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:53:00.000'
      },
      {
        ok: '004XX S LARAMIE AVE'
      },
      {
        ok: '031A'
      },
      {
        ok: 'ROBBERY'
      },
      {
        ok: 'ARMED: HANDGUN'
      },
      {
        ok: 'SIDEWALK'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '1522'
      },
      {
        ok: '15'
      },
      {
        ok: '29'
      },
      {
        ok: '25'
      },
      {
        ok: '3'
      },
      {
        ok: '1141799'
      },
      {
        ok: '1897396'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.87452002'
      },
      {
        ok: '-87.75484623'
      },
      {
        ok: '(41.874520022, -87.754846231)'
      }
    ],
    offset: 0
  },
  {
    row: [
      {
        ok: '10376574'
      },
      {
        error: {
          message: 'Failed to convert "HZ112920" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112920'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:45:00.000'
      },
      {
        ok: '003XX N CENTRAL AVE'
      },
      {
        ok: '031A'
      },
      {
        ok: 'ROBBERY'
      },
      {
        ok: 'ARMED: HANDGUN'
      },
      {
        ok: 'STREET'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '1523'
      },
      {
        ok: '15'
      },
      {
        ok: '28'
      },
      {
        ok: '25'
      },
      {
        ok: '3'
      },
      {
        ok: '1138978'
      },
      {
        ok: '1901836'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.88675567'
      },
      {
        ok: '-87.76509592'
      },
      {
        ok: '(41.886755667, -87.765095923)'
      }
    ],
    offset: 1
  },
  {
    row: [
      {
        ok: '10376371'
      },
      {
        error: {
          message: 'Failed to convert "HZ112605" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112605'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:30:00.000'
      },
      {
        ok: '004XX E 48TH ST'
      },
      {
        ok: '910'
      },
      {
        ok: 'MOTOR VEHICLE THEFT'
      },
      {
        ok: 'AUTOMOBILE'
      },
      {
        ok: 'STREET'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '223'
      },
      {
        ok: '2'
      },
      {
        ok: '3'
      },
      {
        ok: '38'
      },
      {
        ok: '7'
      },
      {
        ok: '1180055'
      },
      {
        ok: '1873293'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.80758633'
      },
      {
        ok: '-87.61512779'
      },
      {
        ok: '(41.807586328, -87.615127788)'
      }
    ],
    offset: 2
  },
  {
    row: [
      {
        ok: '10380234'
      },
      {
        error: {
          message: 'Failed to convert "HZ116304" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ116304'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:30:00.000'
      },
      {
        ok: '055XX S CORNELL AVE'
      },
      {
        ok: '910'
      },
      {
        ok: 'MOTOR VEHICLE THEFT'
      },
      {
        ok: 'AUTOMOBILE'
      },
      {
        ok: 'STREET'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '235'
      },
      {
        ok: '2'
      },
      {
        ok: '5'
      },
      {
        ok: '41'
      },
      {
        ok: '7'
      },
      {
        ok: '1188201'
      },
      {
        ok: '1868688'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.7947592'
      },
      {
        ok: '-87.58539793'
      },
      {
        ok: '(41.794759204, -87.585397931)'
      }
    ],
    offset: 3
  },
  {
    row: [
      {
        ok: '10375856'
      },
      {
        error: {
          message: 'Failed to convert "HZ112435" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112435'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:30:00.000'
      },
      {
        ok: '001XX S CENTRAL AVE'
      },
      {
        ok: '560'
      },
      {
        ok: 'ASSAULT'
      },
      {
        ok: 'SIMPLE'
      },
      {
        ok: 'RESIDENCE'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '1522'
      },
      {
        ok: '15'
      },
      {
        ok: '29'
      },
      {
        ok: '25'
      },
      {
        ok: '08A'
      },
      {
        ok: '1139082'
      },
      {
        ok: '1898717'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.87819484'
      },
      {
        ok: '-87.76478988'
      },
      {
        ok: '(41.878194837, -87.764789883)'
      }
    ],
    offset: 4
  },
  {
    row: [
      {
        ok: '10375836'
      },
      {
        error: {
          message: 'Failed to convert "HZ112407" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112407'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:25:00.000'
      },
      {
        ok: '063XX S KEDZIE AVE'
      },
      {
        ok: '1330'
      },
      {
        ok: 'CRIMINAL TRESPASS'
      },
      {
        ok: 'TO LAND'
      },
      {
        ok: 'DRUG STORE'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '823'
      },
      {
        ok: '8'
      },
      {
        ok: '15'
      },
      {
        ok: '66'
      },
      {
        ok: '26'
      },
      {
        ok: '1156143'
      },
      {
        ok: '1862448'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.77834098'
      },
      {
        ok: '-87.70312224'
      },
      {
        ok: '(41.778340981, -87.703122242)'
      }
    ],
    offset: 5
  },
  {
    row: [
      {
        ok: '10376791'
      },
      {
        error: {
          message: 'Failed to convert "HZ112953" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112953'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:20:00.000'
      },
      {
        ok: '004XX W 76TH ST'
      },
      {
        ok: '031A'
      },
      {
        ok: 'ROBBERY'
      },
      {
        ok: 'ARMED: HANDGUN'
      },
      {
        ok: 'OTHER'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '621'
      },
      {
        ok: '6'
      },
      {
        ok: '17'
      },
      {
        ok: '69'
      },
      {
        ok: '3'
      },
      {
        ok: '1174859'
      },
      {
        ok: '1854542'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.75624913'
      },
      {
        ok: '-87.63474388'
      },
      {
        ok: '(41.756249125, -87.634743877)'
      }
    ],
    offset: 6
  },
  {
    row: [
      {
        ok: '10375849'
      },
      {
        error: {
          message: 'Failed to convert "HZ112411" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112411'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:15:00.000'
      },
      {
        ok: '024XX N NARRAGANSETT AVE'
      },
      {
        ok: '460'
      },
      {
        ok: 'BATTERY'
      },
      {
        ok: 'SIMPLE'
      },
      {
        ok: 'ATHLETIC CLUB'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '2512'
      },
      {
        ok: '25'
      },
      {
        ok: '36'
      },
      {
        ok: '19'
      },
      {
        ok: '08B'
      },
      {
        ok: '1133346'
      },
      {
        ok: '1915440'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.92418726'
      },
      {
        ok: '-87.7854594'
      },
      {
        ok: '(41.924187262, -87.785459395)'
      }
    ],
    offset: 7
  },
  {
    row: [
      {
        ok: '10376251'
      },
      {
        error: {
          message: 'Failed to convert "HZ112670" to boolean',
          inputs: {
            case_number: {
              ok: 'HZ112670'
            }
          }
        }
      },
      {
        ok: '2016-01-11T23:15:00.000'
      },
      {
        ok: '037XX W FLOURNOY ST'
      },
      {
        ok: '820'
      },
      {
        ok: 'THEFT'
      },
      {
        ok: '$500 AND UNDER'
      },
      {
        ok: 'STREET'
      },
      {
        ok: false
      },
      {
        ok: false
      },
      {
        ok: '1133'
      },
      {
        ok: '11'
      },
      {
        ok: '24'
      },
      {
        ok: '27'
      },
      {
        ok: '6'
      },
      {
        ok: '1151652'
      },
      {
        ok: '1896775'
      },
      {
        ok: '2016'
      },
      {
        ok: '2016-01-18T15:54:00.000'
      },
      {
        ok: '41.87262801'
      },
      {
        ok: '-87.71868635'
      },
      {
        ok: '(41.872628006, -87.718686345)'
      }
    ],
    offset: 8
  }
];

export const errorExport = {
  errors: 'blah'
};

export const rowErrors = [
  {
    offset: 9,
    error: {
      wanted: 22,
      type: 'too_short',
      got: 21,
      contents: [
        null,
        null,
        null,
        null,
        '66',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ]
    }
  },
  {
    offset: 10,
    error: {
      wanted: 22,
      type: 'too_short',
      got: 21,
      contents: [
        null,
        null,
        null,
        '44',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ]
    }
  }
];

export const validateRowIdentifier = { valid: true };

export const applyRevision = {
  resource: {
    updated_at: '2017-06-22T01:41:43.909024',
    status: 'initializing',
    output_schema_id: 27395,
    log: [],
    job_uuid: '6235f0c1-8c21-411c-8a83-1841dc5559d8',
    id: 661,
    finished_at: null,
    created_by: {
      user_id: 't9gi-nmnm',
      email: 'peter.vilter@socrata.com',
      display_name: 'Peter Vilter'
    },
    created_at: '2017-06-22T01:41:43.909017'
  },
  links: {
    show: '/api/publishing/v1/revision/t27g-9az3/0/apply/661'
  }
};

export const updateRevision = permission => ({
  resource: {
    task_sets: [],
    revision_seq: 0,
    metadata: null,
    id: 201,
    fourfour: '2ttq-aktm',
    created_by: {
      user_id: 'tugg-ikce',
      email: 'brandon.webster@socrata.com',
      display_name: 'branweb'
    },
    created_at: '2017-06-19T21:47:07.086103',
    closed_at: null,
    action: {
      type: 'update',
      schema: null,
      permission
    }
  },
  links: {
    update: '/api/publishing/v1/revision/2ttq-aktm/0',
    show: '/api/publishing/v1/revision/2ttq-aktm/0',
    metadata: '/api/publishing/v1/revision/2ttq-aktm/0',
    discard: '/api/publishing/v1/revision/2ttq-aktm/0',
    create_source: '/api/publishing/v1/revision/2ttq-aktm/0/source',
    apply: '/api/publishing/v1/revision/2ttq-aktm/0/apply'
  }
});

export const getRevision = {
  resource: {
    task_sets: [
      {
        id: 52,
        status: 'successful'
      }
    ],
    revision_seq: 0,
    metadata: null,
    id: 201,
    fourfour: '2ttq-aktm',
    created_by: {
      user_id: 'tugg-ikce',
      email: 'brandon.webster@socrata.com',
      display_name: 'branweb'
    },
    created_at: '2017-06-19T21:47:07.086103',
    closed_at: null,
    action: {
      type: 'update',
      schema: null,
      permission: 'public'
    }
  },
  links: {
    update: '/api/publishing/v1/revision/2ttq-aktm/0',
    show: '/api/publishing/v1/revision/2ttq-aktm/0',
    metadata: '/api/publishing/v1/revision/2ttq-aktm/0',
    discard: '/api/publishing/v1/revision/2ttq-aktm/0',
    create_source: '/api/publishing/v1/revision/2ttq-aktm/0/source',
    apply: '/api/publishing/v1/revision/2ttq-aktm/0/apply'
  }
};
