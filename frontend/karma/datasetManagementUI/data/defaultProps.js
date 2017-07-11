import _ from 'lodash';

export const ShowOutputSchemaProps = {
  goHome: _.noop,
  dispatch: _.noop,
  location: {
    pathname:
      '/dataset/okokokokokok/nn5w-zj56/revisions/0/sources/123/schemas/106/output/152',
    search: '',
    hash: '',
    action: 'PUSH',
    key: '5wnin1',
    query: {}
  },
  params: {
    category: 'dataset',
    name: 'okokokokokok',
    fourfour: 'nn5w-zj56',
    revisionSeq: '0',
    sourceId: '123',
    inputSchemaId: '106',
    outputSchemaId: '152'
  },
  route: {
    path: 'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId',
    childRoutes: [
      {
        path: 'page/:pageNo'
      }
    ]
  },
  router: {
    location: {
      pathname:
        '/dataset/okokokokokok/nn5w-zj56/revisions/0/sources/123/schemas/106/output/152',
      search: '',
      hash: '',
      action: 'PUSH',
      key: '5wnin1',
      query: {}
    },
    params: {
      category: 'dataset',
      name: 'okokokokokok',
      fourfour: 'nn5w-zj56',
      revisionSeq: '0',
      sourceId: '123',
      inputSchemaId: '106',
      outputSchemaId: '152'
    },
    routes: [
      {
        path: '/:category/:name/:fourfour/revisions/:revisionSeq',
        indexRoute: {},
        childRoutes: [
          {
            from: 'metadata',
            to: 'metadata/dataset',
            path: 'metadata'
          },
          {
            path: 'metadata/dataset'
          },
          {
            path: 'metadata/columns'
          },
          {
            path: 'sources'
          },
          {
            path: ':sidebarSelection'
          },
          {
            path: 'sources/:sourceId'
          },
          {
            path:
              'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId',
            childRoutes: [
              {
                path: 'page/:pageNo'
              }
            ]
          },
          {
            path:
              'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/column_errors/:errorsTransformId',
            childRoutes: [
              {
                path: 'page/:pageNo'
              }
            ]
          },
          {
            path:
              'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors',
            childRoutes: [
              {
                path: 'page/:pageNo'
              }
            ]
          },
          {
            path: '*'
          }
        ]
      },
      {
        path: 'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId',
        childRoutes: [
          {
            path: 'page/:pageNo'
          }
        ]
      }
    ]
  },
  routeParams: {
    sourceId: '123',
    inputSchemaId: '106',
    outputSchemaId: '152'
  },
  routes: [
    {
      path: '/:category/:name/:fourfour/revisions/:revisionSeq',
      indexRoute: {},
      childRoutes: [
        {
          from: 'metadata',
          to: 'metadata/dataset',
          path: 'metadata'
        },
        {
          path: 'metadata/dataset'
        },
        {
          path: 'metadata/columns'
        },
        {
          path: 'sources'
        },
        {
          path: ':sidebarSelection'
        },
        {
          path: 'sources/:sourceId'
        },
        {
          path:
            'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId',
          childRoutes: [
            {
              path: 'page/:pageNo'
            }
          ]
        },
        {
          path:
            'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/column_errors/:errorsTransformId',
          childRoutes: [
            {
              path: 'page/:pageNo'
            }
          ]
        },
        {
          path:
            'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors',
          childRoutes: [
            {
              path: 'page/:pageNo'
            }
          ]
        },
        {
          path: '*'
        }
      ]
    },
    {
      path: 'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId',
      childRoutes: [
        {
          path: 'page/:pageNo'
        }
      ]
    }
  ],
  children: null,
  source: {
    id: 123,
    created_by: {
      user_id: 'tugg-ikce',
      email: 'brandon.webster@socrata.com',
      display_name: 'branweb'
    },
    created_at: '2017-06-15T18:59:50.514260',
    source_type: {
      type: 'upload',
      filename: 'austin_animal_center_stray_map.csv',
    },
    percentCompleted: 100,
    finished_at: '2017-06-15T18:59:52.712Z'
  },
  inputSchema: {
    id: 106,
    name: null,
    total_rows: 143,
    source_id: 123,
    num_row_errors: 0
  },
  outputSchema: {
    id: 152,
    input_schema_id: 106,
    error_count: 0,
    created_at: '2017-06-15T18:59:51.571Z',
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
              input_column_id: 2083
            }
          ],
          transform_expr: '`animal_id`',
          output_soql_type: 'text',
          id: 2115,
          failed_at: null,
          completed_at: '2017-06-15T18:59:52',
          attempts: 0
        },
        position: 0,
        is_primary_key: false,
        id: 2121,
        field_name: 'animal_id',
        display_name: 'Animal ID',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 2084
            }
          ],
          transform_expr: '`found_location`',
          output_soql_type: 'text',
          id: 2116,
          failed_at: null,
          completed_at: '2017-06-15T18:59:52',
          attempts: 0
        },
        position: 1,
        is_primary_key: false,
        id: 2122,
        field_name: 'found_location',
        display_name: 'Found Location',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 2085
            }
          ],
          transform_expr: '`at_aac`',
          output_soql_type: 'text',
          id: 2117,
          failed_at: null,
          completed_at: '2017-06-15T18:59:52',
          attempts: 0
        },
        position: 2,
        is_primary_key: false,
        id: 2123,
        field_name: 'at_aac',
        display_name: 'At AAC',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 2086
            }
          ],
          transform_expr: 'to_floating_timestamp(`intake_date`)',
          output_soql_type: 'calendar_date',
          id: 2118,
          failed_at: null,
          completed_at: '2017-06-15T18:59:52',
          attempts: 0
        },
        position: 3,
        is_primary_key: false,
        id: 2124,
        field_name: 'intake_date',
        display_name: 'Intake Date',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 2087
            }
          ],
          transform_expr: '`type`',
          output_soql_type: 'text',
          id: 2119,
          failed_at: null,
          completed_at: '2017-06-15T18:59:52',
          attempts: 0
        },
        position: 4,
        is_primary_key: false,
        id: 2125,
        field_name: 'type',
        display_name: 'Type',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 2088
            }
          ],
          transform_expr: '`looks_like`',
          output_soql_type: 'text',
          id: 2120,
          failed_at: null,
          completed_at: '2017-06-15T18:59:52',
          attempts: 0
        },
        position: 5,
        is_primary_key: false,
        id: 2126,
        field_name: 'looks_like',
        display_name: 'Looks Like',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 2089
            }
          ],
          transform_expr: '`color`',
          output_soql_type: 'text',
          id: 2121,
          failed_at: null,
          completed_at: '2017-06-15T18:59:52',
          attempts: 0
        },
        position: 6,
        is_primary_key: false,
        id: 2127,
        field_name: 'color',
        display_name: 'Color',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 2090
            }
          ],
          transform_expr: '`sex`',
          output_soql_type: 'text',
          id: 2122,
          failed_at: null,
          completed_at: '2017-06-15T18:59:52',
          attempts: 0
        },
        position: 7,
        is_primary_key: false,
        id: 2128,
        field_name: 'sex',
        display_name: 'Sex',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 2091
            }
          ],
          transform_expr: '`age`',
          output_soql_type: 'text',
          id: 2123,
          failed_at: null,
          completed_at: '2017-06-15T18:59:52',
          attempts: 0
        },
        position: 8,
        is_primary_key: false,
        id: 2129,
        field_name: 'age',
        display_name: 'Age',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 2092
            }
          ],
          transform_expr: '`image_link`',
          output_soql_type: 'text',
          id: 2124,
          failed_at: null,
          completed_at: '2017-06-15T18:59:52',
          attempts: 0
        },
        position: 9,
        is_primary_key: false,
        id: 2130,
        field_name: 'image_link',
        display_name: 'Image Link',
        description: ''
      }
    ],
    completed_at: '2017-06-15T18:59:52.000Z'
  },
  columns: [
    {
      position: 0,
      is_primary_key: false,
      id: 2121,
      field_name: 'animal_id',
      display_name: 'Animal ID',
      description: '',
      transform_id: 2115,
      transform: {
        transform_input_columns: [
          {
            input_column_id: 2083
          }
        ],
        transform_expr: '`animal_id`',
        output_soql_type: 'text',
        id: 2115,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      }
    },
    {
      position: 1,
      is_primary_key: false,
      id: 2122,
      field_name: 'found_location',
      display_name: 'Found Location',
      description: '',
      transform_id: 2116,
      transform: {
        transform_input_columns: [
          {
            input_column_id: 2084
          }
        ],
        transform_expr: '`found_location`',
        output_soql_type: 'text',
        id: 2116,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      }
    },
    {
      position: 2,
      is_primary_key: false,
      id: 2123,
      field_name: 'at_aac',
      display_name: 'At AAC',
      description: '',
      transform_id: 2117,
      transform: {
        transform_input_columns: [
          {
            input_column_id: 2085
          }
        ],
        transform_expr: '`at_aac`',
        output_soql_type: 'text',
        id: 2117,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      }
    },
    {
      position: 3,
      is_primary_key: false,
      id: 2124,
      field_name: 'intake_date',
      display_name: 'Intake Date',
      description: '',
      transform_id: 2118,
      transform: {
        transform_input_columns: [
          {
            input_column_id: 2086
          }
        ],
        transform_expr: 'to_floating_timestamp(`intake_date`)',
        output_soql_type: 'calendar_date',
        id: 2118,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      }
    },
    {
      position: 4,
      is_primary_key: false,
      id: 2125,
      field_name: 'type',
      display_name: 'Type',
      description: '',
      transform_id: 2119,
      transform: {
        transform_input_columns: [
          {
            input_column_id: 2087
          }
        ],
        transform_expr: '`type`',
        output_soql_type: 'text',
        id: 2119,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      }
    },
    {
      position: 5,
      is_primary_key: false,
      id: 2126,
      field_name: 'looks_like',
      display_name: 'Looks Like',
      description: '',
      transform_id: 2120,
      transform: {
        transform_input_columns: [
          {
            input_column_id: 2088
          }
        ],
        transform_expr: '`looks_like`',
        output_soql_type: 'text',
        id: 2120,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      }
    },
    {
      position: 6,
      is_primary_key: false,
      id: 2127,
      field_name: 'color',
      display_name: 'Color',
      description: '',
      transform_id: 2121,
      transform: {
        transform_input_columns: [
          {
            input_column_id: 2089
          }
        ],
        transform_expr: '`color`',
        output_soql_type: 'text',
        id: 2121,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      }
    },
    {
      position: 7,
      is_primary_key: false,
      id: 2128,
      field_name: 'sex',
      display_name: 'Sex',
      description: '',
      transform_id: 2122,
      transform: {
        transform_input_columns: [
          {
            input_column_id: 2090
          }
        ],
        transform_expr: '`sex`',
        output_soql_type: 'text',
        id: 2122,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      }
    },
    {
      position: 8,
      is_primary_key: false,
      id: 2129,
      field_name: 'age',
      display_name: 'Age',
      description: '',
      transform_id: 2123,
      transform: {
        transform_input_columns: [
          {
            input_column_id: 2091
          }
        ],
        transform_expr: '`age`',
        output_soql_type: 'text',
        id: 2123,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      }
    },
    {
      position: 9,
      is_primary_key: false,
      id: 2130,
      field_name: 'image_link',
      display_name: 'Image Link',
      description: '',
      transform_id: 2124,
      transform: {
        transform_input_columns: [
          {
            input_column_id: 2092
          }
        ],
        transform_expr: '`image_link`',
        output_soql_type: 'text',
        id: 2124,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      }
    }
  ],
  canApplyRevision: true,
  numLoadsInProgress: 0,
  displayState: {
    type: 'NORMAL',
    pageNo: 1,
    outputSchemaId: 152
  },
  routing: {
    pathname:
      '/dataset/okokokokokok/nn5w-zj56/revisions/0/sources/123/schemas/106/output/152',
    search: '',
    hash: '',
    action: 'PUSH',
    key: '5wnin1',
    query: {}
  },
  urlParams: {
    category: 'dataset',
    name: 'okokokokokok',
    fourfour: 'nn5w-zj56',
    revisionSeq: '0',
    sourceId: '123',
    inputSchemaId: '106',
    outputSchemaId: '152'
  }
};

export const ShowOutputSchemaErrorProps = {
  goHome: _.noop,
  dispatch: _.noop,
  location: {
    pathname:
      '/dataset/dfsdfdsf/j5db-bk6x/revisions/0/sources/131/schemas/114/output/168/row_errors',
    search: '',
    hash: '',
    action: 'PUSH',
    key: 'cgu5qi',
    query: {}
  },
  params: {
    category: 'dataset',
    name: 'dfsdfdsf',
    fourfour: 'j5db-bk6x',
    revisionSeq: '0',
    sourceId: '131',
    inputSchemaId: '114',
    outputSchemaId: '168'
  },
  route: {
    path:
      'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors',
    childRoutes: [
      {
        path: 'page/:pageNo'
      }
    ]
  },
  router: {
    location: {
      pathname:
        '/dataset/dfsdfdsf/j5db-bk6x/revisions/0/sources/131/schemas/114/output/168/row_errors',
      search: '',
      hash: '',
      action: 'PUSH',
      key: 'cgu5qi',
      query: {}
    },
    params: {
      category: 'dataset',
      name: 'dfsdfdsf',
      fourfour: 'j5db-bk6x',
      revisionSeq: '0',
      sourceId: '131',
      inputSchemaId: '114',
      outputSchemaId: '168'
    },
    routes: [
      {
        path: '/:category/:name/:fourfour/revisions/:revisionSeq',
        indexRoute: {},
        childRoutes: [
          {
            from: 'metadata',
            to: 'metadata/dataset',
            path: 'metadata'
          },
          {
            path: 'metadata/dataset'
          },
          {
            path: 'metadata/columns'
          },
          {
            path: 'sources'
          },
          {
            path: ':sidebarSelection'
          },
          {
            path: 'sources/:sourceId'
          },
          {
            path:
              'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId',
            childRoutes: [
              {
                path: 'page/:pageNo'
              }
            ]
          },
          {
            path:
              'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/column_errors/:errorsTransformId',
            childRoutes: [
              {
                path: 'page/:pageNo'
              }
            ]
          },
          {
            path:
              'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors',
            childRoutes: [
              {
                path: 'page/:pageNo'
              }
            ]
          },
          {
            path: '*'
          }
        ]
      },
      {
        path:
          'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors',
        childRoutes: [
          {
            path: 'page/:pageNo'
          }
        ]
      }
    ]
  },
  routeParams: {
    sourceId: '131',
    inputSchemaId: '114',
    outputSchemaId: '168'
  },
  routes: [
    {
      path: '/:category/:name/:fourfour/revisions/:revisionSeq',
      indexRoute: {},
      childRoutes: [
        {
          from: 'metadata',
          to: 'metadata/dataset',
          path: 'metadata'
        },
        {
          path: 'metadata/dataset'
        },
        {
          path: 'metadata/columns'
        },
        {
          path: 'sources'
        },
        {
          path: ':sidebarSelection'
        },
        {
          path: 'sources/:sourceId'
        },
        {
          path:
            'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId',
          childRoutes: [
            {
              path: 'page/:pageNo'
            }
          ]
        },
        {
          path:
            'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/column_errors/:errorsTransformId',
          childRoutes: [
            {
              path: 'page/:pageNo'
            }
          ]
        },
        {
          path:
            'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors',
          childRoutes: [
            {
              path: 'page/:pageNo'
            }
          ]
        },
        {
          path: '*'
        }
      ]
    },
    {
      path:
        'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors',
      childRoutes: [
        {
          path: 'page/:pageNo'
        }
      ]
    }
  ],
  children: null,
  source: {
    id: 131,
    created_by: {
      user_id: 'tugg-ikce',
      email: 'brandon.webster@socrata.com',
      display_name: 'branweb'
    },
    created_at: '2017-06-16T17:27:47.900Z',
    source_type: {
      type: 'upload',
      filename: 'tiny-errors.csv',
    },
    percentCompleted: 100,
    finished_at: '2017-06-16T17:27:48.352Z'
  },
  inputSchema: {
    total_rows: 3,
    id: 114,
    name: null,
    source_id: 131,
    num_row_errors: 1
  },
  outputSchema: {
    id: 168,
    input_schema_id: 114,
    error_count: 1,
    created_at: '2017-06-16T17:27:48.212Z',
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
              input_column_id: 2191
            }
          ],
          transform_expr: '`foo`',
          output_soql_type: 'text',
          id: 2228,
          failed_at: null,
          completed_at: '2017-06-16T17:27:48',
          attempts: 0
        },
        position: 0,
        is_primary_key: false,
        id: 2235,
        field_name: 'foo',
        display_name: 'foo',
        description: ''
      },
      {
        transform: {
          transform_input_columns: [
            {
              input_column_id: 2192
            }
          ],
          transform_expr: '`bar`',
          output_soql_type: 'text',
          id: 2229,
          failed_at: null,
          completed_at: '2017-06-16T17:27:48',
          attempts: 0
        },
        position: 1,
        is_primary_key: false,
        id: 2236,
        field_name: 'bar',
        display_name: 'bar',
        description: ''
      }
    ],
    completed_at: '2017-06-16T17:27:48.000Z'
  },
  columns: [
    {
      position: 0,
      is_primary_key: false,
      id: 2235,
      field_name: 'foo',
      display_name: 'foo',
      description: '',
      transform_id: 2228,
      transform: {
        transform_input_columns: [
          {
            input_column_id: 2191
          }
        ],
        transform_expr: '`foo`',
        output_soql_type: 'text',
        id: 2228,
        failed_at: null,
        completed_at: '2017-06-16T17:27:48',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 3
      }
    },
    {
      position: 1,
      is_primary_key: false,
      id: 2236,
      field_name: 'bar',
      display_name: 'bar',
      description: '',
      transform_id: 2229,
      transform: {
        transform_input_columns: [
          {
            input_column_id: 2192
          }
        ],
        transform_expr: '`bar`',
        output_soql_type: 'text',
        id: 2229,
        failed_at: null,
        completed_at: '2017-06-16T17:27:48',
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 3
      }
    }
  ],
  canApplyRevision: true,
  numLoadsInProgress: 0,
  displayState: {
    type: 'ROW_ERRORS',
    pageNo: 1,
    outputSchemaId: 168
  },
  routing: {
    pathname:
      '/dataset/dfsdfdsf/j5db-bk6x/revisions/0/sources/131/schemas/114/output/168/row_errors',
    search: '',
    hash: '',
    action: 'PUSH',
    key: 'cgu5qi',
    query: {}
  },
  urlParams: {
    category: 'dataset',
    name: 'dfsdfdsf',
    fourfour: 'j5db-bk6x',
    revisionSeq: '0',
    sourceId: '131',
    inputSchemaId: '114',
    outputSchemaId: '168'
  }
};

export const ShowRevisionProps = {
  pushToEditMetadata: _.noop,
  createUpload: _.noop,
  location: {
    pathname: '/dataset/okokokokokok/nn5w-zj56/revisions/0/log',
    search: '',
    hash: '',
    action: 'PUSH',
    key: 'pqwdec',
    query: {}
  },
  params: {
    category: 'dataset',
    name: 'okokokokokok',
    fourfour: 'nn5w-zj56',
    revisionSeq: '0',
    sidebarSelection: 'log'
  },
  route: {
    path: ':sidebarSelection'
  },
  router: {
    location: {
      pathname: '/dataset/okokokokokok/nn5w-zj56/revisions/0/log',
      search: '',
      hash: '',
      action: 'PUSH',
      key: 'pqwdec',
      query: {}
    },
    params: {
      category: 'dataset',
      name: 'okokokokokok',
      fourfour: 'nn5w-zj56',
      revisionSeq: '0',
      sidebarSelection: 'log'
    },
    routes: [
      {
        path: '/:category/:name/:fourfour/revisions/:revisionSeq',
        indexRoute: {},
        childRoutes: [
          {
            from: 'metadata',
            to: 'metadata/dataset',
            path: 'metadata'
          },
          {
            path: 'metadata/dataset'
          },
          {
            path: 'metadata/columns'
          },
          {
            path: 'sources'
          },
          {
            path: ':sidebarSelection'
          },
          {
            path: 'sources/:sourceId'
          },
          {
            path:
              'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId',
            childRoutes: [
              {
                path: 'page/:pageNo'
              }
            ]
          },
          {
            path:
              'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/column_errors/:errorsTransformId',
            childRoutes: [
              {
                path: 'page/:pageNo'
              }
            ]
          },
          {
            path:
              'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors',
            childRoutes: [
              {
                path: 'page/:pageNo'
              }
            ]
          },
          {
            path: '*'
          }
        ]
      },
      {
        path: ':sidebarSelection'
      }
    ]
  },
  routeParams: {
    sidebarSelection: 'log'
  },
  routes: [
    {
      path: '/:category/:name/:fourfour/revisions/:revisionSeq',
      indexRoute: {},
      childRoutes: [
        {
          from: 'metadata',
          to: 'metadata/dataset',
          path: 'metadata'
        },
        {
          path: 'metadata/dataset'
        },
        {
          path: 'metadata/columns'
        },
        {
          path: 'sources'
        },
        {
          path: ':sidebarSelection'
        },
        {
          path: 'sources/:sourceId'
        },
        {
          path:
            'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId',
          childRoutes: [
            {
              path: 'page/:pageNo'
            }
          ]
        },
        {
          path:
            'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/column_errors/:errorsTransformId',
          childRoutes: [
            {
              path: 'page/:pageNo'
            }
          ]
        },
        {
          path:
            'sources/:sourceId/schemas/:inputSchemaId/output/:outputSchemaId/row_errors',
          childRoutes: [
            {
              path: 'page/:pageNo'
            }
          ]
        },
        {
          path: '*'
        }
      ]
    },
    {
      path: ':sidebarSelection'
    }
  ],
  children: null,
  view: {
    id: 'nn5w-zj56',
    name: 'okokokokokok',
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
    lastUpdatedAt: '2017-06-15T18:59:34.000Z',
    dataLastUpdatedAt: '2017-06-15T18:59:34.000Z',
    metadataLastUpdatedAt: '2017-06-15T18:59:34.000Z',
    createdAt: '2017-06-15T18:59:34.000Z',
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
    ]
  },
  routing: {
    locationBeforeTransitions: {
      pathname: '/dataset/okokokokokok/nn5w-zj56/revisions/0/log',
      search: '',
      hash: '',
      action: 'PUSH',
      key: 'pqwdec',
      query: {}
    }
  },
  entities: {
    views: {
      'nn5w-zj56': {
        id: 'nn5w-zj56',
        name: 'okokokokokok',
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
        lastUpdatedAt: '2017-06-15T18:59:34.000Z',
        dataLastUpdatedAt: '2017-06-15T18:59:34.000Z',
        metadataLastUpdatedAt: '2017-06-15T18:59:34.000Z',
        createdAt: '2017-06-15T18:59:34.000Z',
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
        ]
      }
    },
    revisions: {
      '187': {
        id: 187,
        fourfour: 'nn5w-zj56',
        task_sets: [30],
        revision_seq: 0,
        created_at: '2017-06-15T18:59:35.004186',
        created_by: {
          user_id: 'tugg-ikce',
          email: 'brandon.webster@socrata.com',
          display_name: 'branweb'
        },
        metadata: null,
        closed_at: '2017-06-15T19:00:03',
        action: {
          type: 'replace',
          schema: null
        }
      }
    },
    sources: {
      '123': {
        id: 123,
        created_by: {
          user_id: 'tugg-ikce',
          email: 'brandon.webster@socrata.com',
          display_name: 'branweb'
        },
        created_at: '2017-06-15T18:59:50.514260',
        source_type: {
          type: 'upload',
          filename: 'austin_animal_center_stray_map.csv',
        },
        percentCompleted: 100,
        finished_at: '2017-06-15T18:59:52.712Z'
      }
    },
    input_schemas: {
      '106': {
        id: 106,
        name: null,
        total_rows: 143,
        source_id: 123,
        num_row_errors: 0
      }
    },
    input_columns: {
      '2083': {
        soql_type: 'text',
        position: 0,
        input_schema_id: 106,
        id: 2083,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'animal_id'
      },
      '2084': {
        soql_type: 'text',
        position: 1,
        input_schema_id: 106,
        id: 2084,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'found_location'
      },
      '2085': {
        soql_type: 'text',
        position: 2,
        input_schema_id: 106,
        id: 2085,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'at_aac'
      },
      '2086': {
        soql_type: 'text',
        position: 3,
        input_schema_id: 106,
        id: 2086,
        guessed_subtypes: [],
        guessed_soql_type: 'calendar_date',
        field_name: 'intake_date'
      },
      '2087': {
        soql_type: 'text',
        position: 4,
        input_schema_id: 106,
        id: 2087,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'type'
      },
      '2088': {
        soql_type: 'text',
        position: 5,
        input_schema_id: 106,
        id: 2088,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'looks_like'
      },
      '2089': {
        soql_type: 'text',
        position: 6,
        input_schema_id: 106,
        id: 2089,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'color'
      },
      '2090': {
        soql_type: 'text',
        position: 7,
        input_schema_id: 106,
        id: 2090,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'sex'
      },
      '2091': {
        soql_type: 'text',
        position: 8,
        input_schema_id: 106,
        id: 2091,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'age'
      },
      '2092': {
        soql_type: 'text',
        position: 9,
        input_schema_id: 106,
        id: 2092,
        guessed_subtypes: [],
        guessed_soql_type: 'text',
        field_name: 'image_link'
      }
    },
    output_schemas: {
      '152': {
        id: 152,
        input_schema_id: 106,
        error_count: 0,
        created_at: '2017-06-15T18:59:51.571Z',
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
                  input_column_id: 2083
                }
              ],
              transform_expr: '`animal_id`',
              output_soql_type: 'text',
              id: 2115,
              failed_at: null,
              completed_at: '2017-06-15T18:59:52',
              attempts: 0
            },
            position: 0,
            is_primary_key: false,
            id: 2121,
            field_name: 'animal_id',
            display_name: 'Animal ID',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 2084
                }
              ],
              transform_expr: '`found_location`',
              output_soql_type: 'text',
              id: 2116,
              failed_at: null,
              completed_at: '2017-06-15T18:59:52',
              attempts: 0
            },
            position: 1,
            is_primary_key: false,
            id: 2122,
            field_name: 'found_location',
            display_name: 'Found Location',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 2085
                }
              ],
              transform_expr: '`at_aac`',
              output_soql_type: 'text',
              id: 2117,
              failed_at: null,
              completed_at: '2017-06-15T18:59:52',
              attempts: 0
            },
            position: 2,
            is_primary_key: false,
            id: 2123,
            field_name: 'at_aac',
            display_name: 'At AAC',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 2086
                }
              ],
              transform_expr: 'to_floating_timestamp(`intake_date`)',
              output_soql_type: 'calendar_date',
              id: 2118,
              failed_at: null,
              completed_at: '2017-06-15T18:59:52',
              attempts: 0
            },
            position: 3,
            is_primary_key: false,
            id: 2124,
            field_name: 'intake_date',
            display_name: 'Intake Date',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 2087
                }
              ],
              transform_expr: '`type`',
              output_soql_type: 'text',
              id: 2119,
              failed_at: null,
              completed_at: '2017-06-15T18:59:52',
              attempts: 0
            },
            position: 4,
            is_primary_key: false,
            id: 2125,
            field_name: 'type',
            display_name: 'Type',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 2088
                }
              ],
              transform_expr: '`looks_like`',
              output_soql_type: 'text',
              id: 2120,
              failed_at: null,
              completed_at: '2017-06-15T18:59:52',
              attempts: 0
            },
            position: 5,
            is_primary_key: false,
            id: 2126,
            field_name: 'looks_like',
            display_name: 'Looks Like',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 2089
                }
              ],
              transform_expr: '`color`',
              output_soql_type: 'text',
              id: 2121,
              failed_at: null,
              completed_at: '2017-06-15T18:59:52',
              attempts: 0
            },
            position: 6,
            is_primary_key: false,
            id: 2127,
            field_name: 'color',
            display_name: 'Color',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 2090
                }
              ],
              transform_expr: '`sex`',
              output_soql_type: 'text',
              id: 2122,
              failed_at: null,
              completed_at: '2017-06-15T18:59:52',
              attempts: 0
            },
            position: 7,
            is_primary_key: false,
            id: 2128,
            field_name: 'sex',
            display_name: 'Sex',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 2091
                }
              ],
              transform_expr: '`age`',
              output_soql_type: 'text',
              id: 2123,
              failed_at: null,
              completed_at: '2017-06-15T18:59:52',
              attempts: 0
            },
            position: 8,
            is_primary_key: false,
            id: 2129,
            field_name: 'age',
            display_name: 'Age',
            description: ''
          },
          {
            transform: {
              transform_input_columns: [
                {
                  input_column_id: 2092
                }
              ],
              transform_expr: '`image_link`',
              output_soql_type: 'text',
              id: 2124,
              failed_at: null,
              completed_at: '2017-06-15T18:59:52',
              attempts: 0
            },
            position: 9,
            is_primary_key: false,
            id: 2130,
            field_name: 'image_link',
            display_name: 'Image Link',
            description: ''
          }
        ],
        completed_at: '2017-06-15T18:59:52.000Z'
      }
    },
    output_columns: {
      '2121': {
        position: 0,
        is_primary_key: false,
        id: 2121,
        field_name: 'animal_id',
        display_name: 'Animal ID',
        description: '',
        transform_id: 2115
      },
      '2122': {
        position: 1,
        is_primary_key: false,
        id: 2122,
        field_name: 'found_location',
        display_name: 'Found Location',
        description: '',
        transform_id: 2116
      },
      '2123': {
        position: 2,
        is_primary_key: false,
        id: 2123,
        field_name: 'at_aac',
        display_name: 'At AAC',
        description: '',
        transform_id: 2117
      },
      '2124': {
        position: 3,
        is_primary_key: false,
        id: 2124,
        field_name: 'intake_date',
        display_name: 'Intake Date',
        description: '',
        transform_id: 2118
      },
      '2125': {
        position: 4,
        is_primary_key: false,
        id: 2125,
        field_name: 'type',
        display_name: 'Type',
        description: '',
        transform_id: 2119
      },
      '2126': {
        position: 5,
        is_primary_key: false,
        id: 2126,
        field_name: 'looks_like',
        display_name: 'Looks Like',
        description: '',
        transform_id: 2120
      },
      '2127': {
        position: 6,
        is_primary_key: false,
        id: 2127,
        field_name: 'color',
        display_name: 'Color',
        description: '',
        transform_id: 2121
      },
      '2128': {
        position: 7,
        is_primary_key: false,
        id: 2128,
        field_name: 'sex',
        display_name: 'Sex',
        description: '',
        transform_id: 2122
      },
      '2129': {
        position: 8,
        is_primary_key: false,
        id: 2129,
        field_name: 'age',
        display_name: 'Age',
        description: '',
        transform_id: 2123
      },
      '2130': {
        position: 9,
        is_primary_key: false,
        id: 2130,
        field_name: 'image_link',
        display_name: 'Image Link',
        description: '',
        transform_id: 2124
      }
    },
    output_schema_columns: {
      '152-2121': {
        id: '152-2121',
        output_schema_id: 152,
        output_column_id: 2121,
        is_primary_key: false
      },
      '152-2122': {
        id: '152-2122',
        output_schema_id: 152,
        output_column_id: 2122,
        is_primary_key: false
      },
      '152-2123': {
        id: '152-2123',
        output_schema_id: 152,
        output_column_id: 2123,
        is_primary_key: false
      },
      '152-2124': {
        id: '152-2124',
        output_schema_id: 152,
        output_column_id: 2124,
        is_primary_key: false
      },
      '152-2125': {
        id: '152-2125',
        output_schema_id: 152,
        output_column_id: 2125,
        is_primary_key: false
      },
      '152-2126': {
        id: '152-2126',
        output_schema_id: 152,
        output_column_id: 2126,
        is_primary_key: false
      },
      '152-2127': {
        id: '152-2127',
        output_schema_id: 152,
        output_column_id: 2127,
        is_primary_key: false
      },
      '152-2128': {
        id: '152-2128',
        output_schema_id: 152,
        output_column_id: 2128,
        is_primary_key: false
      },
      '152-2129': {
        id: '152-2129',
        output_schema_id: 152,
        output_column_id: 2129,
        is_primary_key: false
      },
      '152-2130': {
        id: '152-2130',
        output_schema_id: 152,
        output_column_id: 2130,
        is_primary_key: false
      }
    },
    transforms: {
      '2115': {
        transform_input_columns: [
          {
            input_column_id: 2083
          }
        ],
        transform_expr: '`animal_id`',
        output_soql_type: 'text',
        id: 2115,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      },
      '2116': {
        transform_input_columns: [
          {
            input_column_id: 2084
          }
        ],
        transform_expr: '`found_location`',
        output_soql_type: 'text',
        id: 2116,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      },
      '2117': {
        transform_input_columns: [
          {
            input_column_id: 2085
          }
        ],
        transform_expr: '`at_aac`',
        output_soql_type: 'text',
        id: 2117,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      },
      '2118': {
        transform_input_columns: [
          {
            input_column_id: 2086
          }
        ],
        transform_expr: 'to_floating_timestamp(`intake_date`)',
        output_soql_type: 'calendar_date',
        id: 2118,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      },
      '2119': {
        transform_input_columns: [
          {
            input_column_id: 2087
          }
        ],
        transform_expr: '`type`',
        output_soql_type: 'text',
        id: 2119,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      },
      '2120': {
        transform_input_columns: [
          {
            input_column_id: 2088
          }
        ],
        transform_expr: '`looks_like`',
        output_soql_type: 'text',
        id: 2120,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      },
      '2121': {
        transform_input_columns: [
          {
            input_column_id: 2089
          }
        ],
        transform_expr: '`color`',
        output_soql_type: 'text',
        id: 2121,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      },
      '2122': {
        transform_input_columns: [
          {
            input_column_id: 2090
          }
        ],
        transform_expr: '`sex`',
        output_soql_type: 'text',
        id: 2122,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      },
      '2123': {
        transform_input_columns: [
          {
            input_column_id: 2091
          }
        ],
        transform_expr: '`age`',
        output_soql_type: 'text',
        id: 2123,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      },
      '2124': {
        transform_input_columns: [
          {
            input_column_id: 2092
          }
        ],
        transform_expr: '`image_link`',
        output_soql_type: 'text',
        id: 2124,
        failed_at: null,
        completed_at: null,
        attempts: 0,
        error_indices: [],
        contiguous_rows_processed: 143
      }
    },
    task_sets: {
      '30': {
        updated_at: '2017-06-15T19:00:03.529274',
        status: 'successful',
        output_schema_id: 152,
        log: [
          {
            time: '2017-06-15T19:00:03',
            stage: 'dataset_tabular',
            details: null
          },
          {
            time: '2017-06-15T19:00:03',
            stage: 'dataset_public',
            details: null
          },
          {
            time: '2017-06-15T19:00:03',
            stage: 'dataset_published',
            details: null
          },
          {
            time: '2017-06-15T19:00:02',
            stage: 'upsert_complete',
            details: {
              'Rows Updated': 0,
              'Rows Deleted': 0,
              'Rows Created': 143,
              Errors: 0,
              'By SID': 0,
              'By RowIdentifier': 0
            }
          },
          {
            time: '2017-06-15T19:00:02',
            stage: 'rows_upserted',
            details: {
              count: 0
            }
          },
          {
            time: '2017-06-15T19:00:02',
            stage: 'columns_created',
            details: {
              created: -10
            }
          },
          {
            time: '2017-06-15T19:00:00',
            stage: 'started',
            details: null
          }
        ],
        job_uuid: 'ed6a7da4-7b0d-433b-a882-b7fb6b0b628e',
        id: 30,
        finished_at: '2017-06-15T19:00:03.000Z',
        created_by: {
          user_id: 'tugg-ikce',
          email: 'brandon.webster@socrata.com',
          display_name: 'branweb'
        },
        created_at: '2017-06-15T19:00:00.359475'
      }
    },
    email_interests: {},
    row_errors: {},
    col_data: {
      '2115': {
        '0': {
          id: 0,
          ok: 'A595045'
        },
        '1': {
          id: 1,
          ok: 'A745842'
        },
        '2': {
          id: 2,
          ok: 'A745853'
        },
        '3': {
          id: 3,
          ok: 'A745848'
        },
        '4': {
          id: 4,
          ok: 'A745861'
        },
        '5': {
          id: 5,
          ok: 'A745912'
        },
        '6': {
          id: 6,
          ok: 'A745932'
        },
        '7': {
          id: 7,
          ok: 'A745938'
        },
        '8': {
          id: 8,
          ok: 'A745940'
        },
        '9': {
          id: 9,
          ok: 'A745924'
        },
        '10': {
          id: 10,
          ok: 'A745926'
        },
        '11': {
          id: 11,
          ok: 'A745963'
        },
        '12': {
          id: 12,
          ok: 'A745969'
        },
        '13': {
          id: 13,
          ok: 'A745972'
        },
        '14': {
          id: 14,
          ok: 'A745966'
        },
        '15': {
          id: 15,
          ok: 'A745544'
        },
        '16': {
          id: 16,
          ok: 'A745967'
        },
        '17': {
          id: 17,
          ok: 'A745968'
        },
        '18': {
          id: 18,
          ok: 'A745971'
        },
        '19': {
          id: 19,
          ok: 'A745987'
        },
        '20': {
          id: 20,
          ok: 'A745991'
        },
        '21': {
          id: 21,
          ok: 'A745992'
        },
        '22': {
          id: 22,
          ok: 'A746003'
        },
        '23': {
          id: 23,
          ok: 'A696083'
        },
        '24': {
          id: 24,
          ok: 'A746014'
        },
        '25': {
          id: 25,
          ok: 'A746000'
        },
        '26': {
          id: 26,
          ok: 'A745964'
        },
        '27': {
          id: 27,
          ok: 'A746002'
        },
        '28': {
          id: 28,
          ok: 'A746006'
        },
        '29': {
          id: 29,
          ok: 'A746005'
        },
        '30': {
          id: 30,
          ok: 'A746004'
        },
        '31': {
          id: 31,
          ok: 'A746001'
        },
        '32': {
          id: 32,
          ok: 'A746027'
        },
        '33': {
          id: 33,
          ok: 'A746030'
        },
        '34': {
          id: 34,
          ok: 'A746029'
        },
        '35': {
          id: 35,
          ok: 'A714773'
        },
        '36': {
          id: 36,
          ok: 'A746011'
        },
        '37': {
          id: 37,
          ok: 'A746028'
        },
        '38': {
          id: 38,
          ok: 'A746010'
        },
        '39': {
          id: 39,
          ok: 'A746026'
        },
        '40': {
          id: 40,
          ok: 'A746039'
        },
        '41': {
          id: 41,
          ok: 'A694334'
        },
        '42': {
          id: 42,
          ok: 'A746050'
        },
        '43': {
          id: 43,
          ok: 'A746052'
        },
        '44': {
          id: 44,
          ok: 'A746060'
        },
        '45': {
          id: 45,
          ok: 'A746058'
        },
        '46': {
          id: 46,
          ok: 'A746087'
        },
        '47': {
          id: 47,
          ok: 'A745970'
        },
        '48': {
          id: 48,
          ok: 'A746091'
        },
        '49': {
          id: 49,
          ok: 'A746092'
        }
      },
      '2116': {
        '0': {
          id: 0,
          ok: '8624 N LAMAR\nAUSTIN 78758\n(30.355026, -97.70332)'
        },
        '1': {
          id: 1,
          ok: '5701 JOHNNY MORRIS RD\nAUSTIN 78724\n(30.292064, -97.653454)'
        },
        '2': {
          id: 2,
          ok: '1608 E PARMER LN\nAUSTIN 78753\n(30.387688, -97.649518)'
        },
        '3': {
          id: 3,
          ok: 'COLLINS CREEK DR\nAUSTIN 78741\n'
        },
        '4': {
          id: 4,
          ok: '7635 GUADALUPE ST\nAUSTIN 78752\n(30.343165, -97.711835)'
        },
        '5': {
          id: 5,
          ok: '1198 AIRPORT BLVD\nAUSTIN 78702\n(30.276622, -97.700179)'
        },
        '6': {
          id: 6,
          ok: 'DELSIE DR\n78734\n'
        },
        '7': {
          id: 7,
          ok: 'NEWCASTLE DR\nAUSTIN 78745\n'
        },
        '8': {
          id: 8,
          ok: 'APPALOOSA CHASE DR\nAUSTIN 78732\n'
        },
        '9': {
          id: 9,
          ok: '7008 LUNAR DR\nAUSTIN 78745\n(30.190514, -97.785233)'
        },
        '10': {
          id: 10,
          ok: '340 S BELL BLVD CEDAR PARK\n78613\n'
        },
        '11': {
          id: 11,
          ok: '13100 COUNCIL BLUFF DR\nAUSTIN 78727\n(30.433006, -97.717909)'
        },
        '12': {
          id: 12,
          ok: '4529 CLETO ST\nAUSTIN 78725\n(30.240567, -97.577346)'
        },
        '13': {
          id: 13,
          ok: '21205 W HWY\n78669\n(30.35306, -98.064615)'
        },
        '14': {
          id: 14,
          ok: '4529 CLETO ST\nAUSTIN 78725\n(30.240567, -97.577346)'
        },
        '15': {
          id: 15,
          ok: '4529 CLETO ST\nAUSTIN 78725\n(30.240567, -97.577346)'
        },
        '16': {
          id: 16,
          ok: '4529 CLETO ST\nAUSTIN 78725\n(30.240567, -97.577346)'
        },
        '17': {
          id: 17,
          ok: '4529 CLETO ST\nAUSTIN 78725\n(30.240567, -97.577346)'
        },
        '18': {
          id: 18,
          ok: 'ALCOTT LANE\nAUSTIN 78748\n'
        },
        '19': {
          id: 19,
          ok: '14507 GOLD FISH POND AVE\nAUSTIN 78728\n(30.442498, -97.682549)'
        },
        '20': {
          id: 20,
          ok: '6003 LEISURE RUN\nAUSTIN 78745\n(30.204724, -97.784893)'
        },
        '21': {
          id: 21,
          ok: '6003 LEISURE RUN\nAUSTIN 78745\n(30.204724, -97.784893)'
        },
        '22': {
          id: 22,
          ok: '701 WOODWARD ST\nAUSTIN 78704\n(30.225731, -97.751977)'
        },
        '23': {
          id: 23,
          ok: 'AUSTIN 78702\n(30.264271, -97.71608)'
        },
        '24': {
          id: 24,
          ok: '10307 MORADO COVE\nAUSTIN 78759\n(30.401743, -97.752925)'
        },
        '25': {
          id: 25,
          ok: '78617\n(30.157123, -97.611102)'
        },
        '26': {
          id: 26,
          ok: '7001 THANNAS WAY\nAUSTIN 78744\n(30.17832, -97.756101)'
        },
        '27': {
          id: 27,
          ok: '78617\n(30.157123, -97.611102)'
        },
        '28': {
          id: 28,
          ok: '78617\n(30.157123, -97.611102)'
        },
        '29': {
          id: 29,
          ok: '78617\n(30.157123, -97.611102)'
        },
        '30': {
          id: 30,
          ok: '78617\n(30.157123, -97.611102)'
        },
        '31': {
          id: 31,
          ok: '78617\n(30.157123, -97.611102)'
        },
        '32': {
          id: 32,
          ok: '5405 GARDEN VIEW CV\nAUSTIN 78724\n(30.290269, -97.659761)'
        },
        '33': {
          id: 33,
          ok: 'POLARIS AVE\nAUSTIN 78757\n'
        },
        '34': {
          id: 34,
          ok: '1955 ONION CREEK PKWY\nAUSTIN 78748\n(30.137649, -97.799772)'
        },
        '35': {
          id: 35,
          ok: 'N W LAMAR BLVD\nAUSTIN 78705\n'
        },
        '36': {
          id: 36,
          ok: 'E RIVERSIDE DR\nAUSTIN 78741\n'
        },
        '37': {
          id: 37,
          ok: '9905 MOUNTIAN QUAIL RD\nAUSTIN 78758\n(30.375452, -97.706409)'
        },
        '38': {
          id: 38,
          ok: 'E RIVERSIDE DR\nAUSTIN 78741\n'
        },
        '39': {
          id: 39,
          ok: '8801 INGRID DR\n78621\n(30.278906, -97.461531)'
        },
        '40': {
          id: 40,
          ok: '11913 MORNING VIEW\nAUSTIN 78617\n(30.153349, -97.648635)'
        },
        '41': {
          id: 41,
          ok: '3600 PRESIDENTIAL BLVD\nAUSTIN 78719\n(30.202653, -97.667267)'
        },
        '42': {
          id: 42,
          ok: 'AUSTIN 78705\n(30.292467, -97.737978)'
        },
        '43': {
          id: 43,
          ok: '4901 EDENBOURGH LN\nAUSTIN 78759\n(30.334575, -97.648423)'
        },
        '44': {
          id: 44,
          ok: '4510 LAREINA DR\nAUSTIN 78745\n(30.217479, -97.771316)'
        },
        '45': {
          id: 45,
          ok: '35 FRONTAGE RD AND WELL BRANCH PKWY\nAUSTIN 78660\n'
        },
        '46': {
          id: 46,
          ok: '4206 ERNEST ROBLES WAY SUNSET VALLEY\n78745\n'
        },
        '47': {
          id: 47,
          ok: '12250 HARRIS BRANCH PKWY\n78724\n'
        },
        '48': {
          id: 48,
          ok: '5001 REAGAN HILLS DR\nAUSTIN 78752\n'
        },
        '49': {
          id: 49,
          ok: '20326 FM\nWEBBERVILLE 78653\n(30.232696, -97.496014)'
        }
      },
      '2117': {
        '0': {
          id: 0,
          ok: 'Yes (come to the shelter)'
        },
        '1': {
          id: 1,
          ok: 'Yes (come to the shelter)'
        },
        '2': {
          id: 2,
          ok: 'Yes (come to the shelter)'
        },
        '3': {
          id: 3,
          ok: 'Yes (come to the shelter)'
        },
        '4': {
          id: 4,
          ok: 'No (contact for more info)'
        },
        '5': {
          id: 5,
          ok: 'No (contact for more info)'
        },
        '6': {
          id: 6,
          ok: 'No (contact for more info)'
        },
        '7': {
          id: 7,
          ok: 'Yes (come to the shelter)'
        },
        '8': {
          id: 8,
          ok: 'Yes (come to the shelter)'
        },
        '9': {
          id: 9,
          ok: 'No (contact for more info)'
        },
        '10': {
          id: 10,
          ok: 'No (contact for more info)'
        },
        '11': {
          id: 11,
          ok: 'No (contact for more info)'
        },
        '12': {
          id: 12,
          ok: 'No (contact for more info)'
        },
        '13': {
          id: 13,
          ok: 'Yes (come to the shelter)'
        },
        '14': {
          id: 14,
          ok: 'No (contact for more info)'
        },
        '15': {
          id: 15,
          ok: 'No (contact for more info)'
        },
        '16': {
          id: 16,
          ok: 'No (contact for more info)'
        },
        '17': {
          id: 17,
          ok: 'No (contact for more info)'
        },
        '18': {
          id: 18,
          ok: 'Yes (come to the shelter)'
        },
        '19': {
          id: 19,
          ok: 'Yes (come to the shelter)'
        },
        '20': {
          id: 20,
          ok: 'Yes (come to the shelter)'
        },
        '21': {
          id: 21,
          ok: 'Yes (come to the shelter)'
        },
        '22': {
          id: 22,
          ok: 'Yes (come to the shelter)'
        },
        '23': {
          id: 23,
          ok: 'Yes (come to the shelter)'
        },
        '24': {
          id: 24,
          ok: 'No (contact for more info)'
        },
        '25': {
          id: 25,
          ok: 'No (contact for more info)'
        },
        '26': {
          id: 26,
          ok: 'Yes (come to the shelter)'
        },
        '27': {
          id: 27,
          ok: 'No (contact for more info)'
        },
        '28': {
          id: 28,
          ok: 'No (contact for more info)'
        },
        '29': {
          id: 29,
          ok: 'No (contact for more info)'
        },
        '30': {
          id: 30,
          ok: 'No (contact for more info)'
        },
        '31': {
          id: 31,
          ok: 'No (contact for more info)'
        },
        '32': {
          id: 32,
          ok: 'Yes (come to the shelter)'
        },
        '33': {
          id: 33,
          ok: 'No (contact for more info)'
        },
        '34': {
          id: 34,
          ok: 'No (contact for more info)'
        },
        '35': {
          id: 35,
          ok: 'No (contact for more info)'
        },
        '36': {
          id: 36,
          ok: 'Yes (come to the shelter)'
        },
        '37': {
          id: 37,
          ok: 'Yes (come to the shelter)'
        },
        '38': {
          id: 38,
          ok: 'Yes (come to the shelter)'
        },
        '39': {
          id: 39,
          ok: 'Yes (come to the shelter)'
        },
        '40': {
          id: 40,
          ok: 'Yes (come to the shelter)'
        },
        '41': {
          id: 41,
          ok: 'Yes (come to the shelter)'
        },
        '42': {
          id: 42,
          ok: 'Yes (come to the shelter)'
        },
        '43': {
          id: 43,
          ok: 'No (contact for more info)'
        },
        '44': {
          id: 44,
          ok: 'Yes (come to the shelter)'
        },
        '45': {
          id: 45,
          ok: 'Yes (come to the shelter)'
        },
        '46': {
          id: 46,
          ok: 'No (contact for more info)'
        },
        '47': {
          id: 47,
          ok: 'Yes (come to the shelter)'
        },
        '48': {
          id: 48,
          ok: 'Yes (come to the shelter)'
        },
        '49': {
          id: 49,
          ok: 'Yes (come to the shelter)'
        }
      },
      '2118': {
        '0': {
          id: 0,
          ok: '2017-03-25T00:00:00.000'
        },
        '1': {
          id: 1,
          ok: '2017-03-25T00:00:00.000'
        },
        '2': {
          id: 2,
          ok: '2017-03-25T00:00:00.000'
        },
        '3': {
          id: 3,
          ok: '2017-03-25T00:00:00.000'
        },
        '4': {
          id: 4,
          ok: '2017-03-25T00:00:00.000'
        },
        '5': {
          id: 5,
          ok: '2017-03-26T00:00:00.000'
        },
        '6': {
          id: 6,
          ok: '2017-03-26T00:00:00.000'
        },
        '7': {
          id: 7,
          ok: '2017-03-26T00:00:00.000'
        },
        '8': {
          id: 8,
          ok: '2017-03-26T00:00:00.000'
        },
        '9': {
          id: 9,
          ok: '2017-03-26T00:00:00.000'
        },
        '10': {
          id: 10,
          ok: '2017-03-26T00:00:00.000'
        },
        '11': {
          id: 11,
          ok: '2017-03-27T00:00:00.000'
        },
        '12': {
          id: 12,
          ok: '2017-03-27T00:00:00.000'
        },
        '13': {
          id: 13,
          ok: '2017-03-27T00:00:00.000'
        },
        '14': {
          id: 14,
          ok: '2017-03-27T00:00:00.000'
        },
        '15': {
          id: 15,
          ok: '2017-03-27T00:00:00.000'
        },
        '16': {
          id: 16,
          ok: '2017-03-27T00:00:00.000'
        },
        '17': {
          id: 17,
          ok: '2017-03-27T00:00:00.000'
        },
        '18': {
          id: 18,
          ok: '2017-03-27T00:00:00.000'
        },
        '19': {
          id: 19,
          ok: '2017-03-27T00:00:00.000'
        },
        '20': {
          id: 20,
          ok: '2017-03-27T00:00:00.000'
        },
        '21': {
          id: 21,
          ok: '2017-03-27T00:00:00.000'
        },
        '22': {
          id: 22,
          ok: '2017-03-27T00:00:00.000'
        },
        '23': {
          id: 23,
          ok: '2017-03-27T00:00:00.000'
        },
        '24': {
          id: 24,
          ok: '2017-03-27T00:00:00.000'
        },
        '25': {
          id: 25,
          ok: '2017-03-28T00:00:00.000'
        },
        '26': {
          id: 26,
          ok: '2017-03-27T00:00:00.000'
        },
        '27': {
          id: 27,
          ok: '2017-03-28T00:00:00.000'
        },
        '28': {
          id: 28,
          ok: '2017-03-28T00:00:00.000'
        },
        '29': {
          id: 29,
          ok: '2017-03-28T00:00:00.000'
        },
        '30': {
          id: 30,
          ok: '2017-03-28T00:00:00.000'
        },
        '31': {
          id: 31,
          ok: '2017-03-28T00:00:00.000'
        },
        '32': {
          id: 32,
          ok: '2017-03-28T00:00:00.000'
        },
        '33': {
          id: 33,
          ok: '2017-03-28T00:00:00.000'
        },
        '34': {
          id: 34,
          ok: '2017-03-28T00:00:00.000'
        },
        '35': {
          id: 35,
          ok: '2017-03-28T00:00:00.000'
        },
        '36': {
          id: 36,
          ok: '2017-03-27T00:00:00.000'
        },
        '37': {
          id: 37,
          ok: '2017-03-28T00:00:00.000'
        },
        '38': {
          id: 38,
          ok: '2017-03-27T00:00:00.000'
        },
        '39': {
          id: 39,
          ok: '2017-03-28T00:00:00.000'
        },
        '40': {
          id: 40,
          ok: '2017-03-28T00:00:00.000'
        },
        '41': {
          id: 41,
          ok: '2017-03-28T00:00:00.000'
        },
        '42': {
          id: 42,
          ok: '2017-03-28T00:00:00.000'
        },
        '43': {
          id: 43,
          ok: '2017-03-28T00:00:00.000'
        },
        '44': {
          id: 44,
          ok: '2017-03-28T00:00:00.000'
        },
        '45': {
          id: 45,
          ok: '2017-03-28T00:00:00.000'
        },
        '46': {
          id: 46,
          ok: '2017-03-28T00:00:00.000'
        },
        '47': {
          id: 47,
          ok: '2017-03-27T00:00:00.000'
        },
        '48': {
          id: 48,
          ok: '2017-03-28T00:00:00.000'
        },
        '49': {
          id: 49,
          ok: '2017-03-28T00:00:00.000'
        }
      },
      '2119': {
        '0': {
          id: 0,
          ok: 'Dog'
        },
        '1': {
          id: 1,
          ok: 'Dog'
        },
        '2': {
          id: 2,
          ok: 'Dog'
        },
        '3': {
          id: 3,
          ok: 'Dog'
        },
        '4': {
          id: 4,
          ok: 'Dog'
        },
        '5': {
          id: 5,
          ok: 'Cat'
        },
        '6': {
          id: 6,
          ok: 'Dog'
        },
        '7': {
          id: 7,
          ok: 'Dog'
        },
        '8': {
          id: 8,
          ok: 'Dog'
        },
        '9': {
          id: 9,
          ok: 'Cat'
        },
        '10': {
          id: 10,
          ok: 'Cat'
        },
        '11': {
          id: 11,
          ok: 'Dog'
        },
        '12': {
          id: 12,
          ok: 'Cat'
        },
        '13': {
          id: 13,
          ok: 'Dog'
        },
        '14': {
          id: 14,
          ok: 'Cat'
        },
        '15': {
          id: 15,
          ok: 'Cat'
        },
        '16': {
          id: 16,
          ok: 'Cat'
        },
        '17': {
          id: 17,
          ok: 'Cat'
        },
        '18': {
          id: 18,
          ok: 'Dog'
        },
        '19': {
          id: 19,
          ok: 'Dog'
        },
        '20': {
          id: 20,
          ok: 'Dog'
        },
        '21': {
          id: 21,
          ok: 'Dog'
        },
        '22': {
          id: 22,
          ok: 'Dog'
        },
        '23': {
          id: 23,
          ok: 'Dog'
        },
        '24': {
          id: 24,
          ok: 'Dog'
        },
        '25': {
          id: 25,
          ok: 'Dog'
        },
        '26': {
          id: 26,
          ok: 'Cat'
        },
        '27': {
          id: 27,
          ok: 'Dog'
        },
        '28': {
          id: 28,
          ok: 'Dog'
        },
        '29': {
          id: 29,
          ok: 'Dog'
        },
        '30': {
          id: 30,
          ok: 'Dog'
        },
        '31': {
          id: 31,
          ok: 'Dog'
        },
        '32': {
          id: 32,
          ok: 'Dog'
        },
        '33': {
          id: 33,
          ok: 'Dog'
        },
        '34': {
          id: 34,
          ok: 'Cat'
        },
        '35': {
          id: 35,
          ok: 'Dog'
        },
        '36': {
          id: 36,
          ok: 'Dog'
        },
        '37': {
          id: 37,
          ok: 'Dog'
        },
        '38': {
          id: 38,
          ok: 'Dog'
        },
        '39': {
          id: 39,
          ok: 'Dog'
        },
        '40': {
          id: 40,
          ok: 'Dog'
        },
        '41': {
          id: 41,
          ok: 'Dog'
        },
        '42': {
          id: 42,
          ok: 'Dog'
        },
        '43': {
          id: 43,
          ok: 'Dog'
        },
        '44': {
          id: 44,
          ok: 'Dog'
        },
        '45': {
          id: 45,
          ok: 'Dog'
        },
        '46': {
          id: 46,
          ok: 'Cat'
        },
        '47': {
          id: 47,
          ok: 'Dog'
        },
        '48': {
          id: 48,
          ok: 'Dog'
        },
        '49': {
          id: 49,
          ok: 'Dog'
        }
      },
      '2120': {
        '0': {
          id: 0,
          ok: 'Boxer Mix'
        },
        '1': {
          id: 1,
          ok: 'Labrador Retriever Mix'
        },
        '2': {
          id: 2,
          ok: 'Doberman Pinsch Mix'
        },
        '3': {
          id: 3,
          ok: 'Chihuahua Shorthair Mix'
        },
        '4': {
          id: 4,
          ok: 'Chihuahua Shorthair Mix'
        },
        '5': {
          id: 5,
          ok: 'Domestic Shorthair Mix'
        },
        '6': {
          id: 6,
          ok: 'Chihuahua Shorthair Mix'
        },
        '7': {
          id: 7,
          ok: 'Pit Bull Mix'
        },
        '8': {
          id: 8,
          ok: 'Pit Bull Mix'
        },
        '9': {
          id: 9,
          ok: 'Domestic Shorthair Mix'
        },
        '10': {
          id: 10,
          ok: 'Domestic Longhair Mix'
        },
        '11': {
          id: 11,
          ok: 'Pit Bull Mix'
        },
        '12': {
          id: 12,
          ok: 'Domestic Shorthair Mix'
        },
        '13': {
          id: 13,
          ok: 'Border Terrier Mix'
        },
        '14': {
          id: 14,
          ok: 'Domestic Shorthair Mix'
        },
        '15': {
          id: 15,
          ok: 'Domestic Shorthair Mix'
        },
        '16': {
          id: 16,
          ok: 'Domestic Shorthair Mix'
        },
        '17': {
          id: 17,
          ok: 'Domestic Shorthair Mix'
        },
        '18': {
          id: 18,
          ok: 'Basset Hound Mix'
        },
        '19': {
          id: 19,
          ok: 'Chihuahua Shorthair Mix'
        },
        '20': {
          id: 20,
          ok: 'Dachshund Mix'
        },
        '21': {
          id: 21,
          ok: 'Chihuahua Shorthair Mix'
        },
        '22': {
          id: 22,
          ok: 'Australian Cattle Dog Mix'
        },
        '23': {
          id: 23,
          ok: 'Pit Bull Mix'
        },
        '24': {
          id: 24,
          ok: 'Labrador Retriever Mix'
        },
        '25': {
          id: 25,
          ok: 'Jack Russell Terrier Mix'
        },
        '26': {
          id: 26,
          ok: 'Domestic Shorthair Mix'
        },
        '27': {
          id: 27,
          ok: 'Jack Russell Terrier Mix'
        },
        '28': {
          id: 28,
          ok: 'Jack Russell Terrier Mix'
        },
        '29': {
          id: 29,
          ok: 'Jack Russell Terrier Mix'
        },
        '30': {
          id: 30,
          ok: 'Jack Russell Terrier Mix'
        },
        '31': {
          id: 31,
          ok: 'Jack Russell Terrier Mix'
        },
        '32': {
          id: 32,
          ok: 'Labrador Retriever Mix'
        },
        '33': {
          id: 33,
          ok: 'Australian Cattle Dog Mix'
        },
        '34': {
          id: 34,
          ok: 'Domestic Shorthair Mix'
        },
        '35': {
          id: 35,
          ok: 'Labrador Retriever/Australian Cattle Dog'
        },
        '36': {
          id: 36,
          ok: 'Tibetan Spaniel Mix'
        },
        '37': {
          id: 37,
          ok: 'Carolina Dog Mix'
        },
        '38': {
          id: 38,
          ok: 'Tibetan Spaniel Mix'
        },
        '39': {
          id: 39,
          ok: 'German Shepherd Mix'
        },
        '40': {
          id: 40,
          ok: 'Catahoula Mix'
        },
        '41': {
          id: 41,
          ok: 'Dachshund Mix'
        },
        '42': {
          id: 42,
          ok: 'Chihuahua Shorthair Mix'
        },
        '43': {
          id: 43,
          ok: 'Australian Cattle Dog Mix'
        },
        '44': {
          id: 44,
          ok: 'Labrador Retriever Mix'
        },
        '45': {
          id: 45,
          ok: 'Boxer Mix'
        },
        '46': {
          id: 46,
          ok: 'Domestic Shorthair Mix'
        },
        '47': {
          id: 47,
          ok: 'German Shepherd Mix'
        },
        '48': {
          id: 48,
          ok: 'Chihuahua Shorthair Mix'
        },
        '49': {
          id: 49,
          ok: 'Rottweiler Mix'
        }
      },
      '2121': {
        '0': {
          id: 0,
          ok: 'Brown/White'
        },
        '1': {
          id: 1,
          ok: 'Black/White'
        },
        '2': {
          id: 2,
          ok: 'Black/Brown'
        },
        '3': {
          id: 3,
          ok: 'White'
        },
        '4': {
          id: 4,
          ok: 'Tan'
        },
        '5': {
          id: 5,
          ok: 'Orange'
        },
        '6': {
          id: 6,
          ok: 'Black'
        },
        '7': {
          id: 7,
          ok: 'Brown'
        },
        '8': {
          id: 8,
          ok: 'Brown Brindle'
        },
        '9': {
          id: 9,
          ok: 'Calico'
        },
        '10': {
          id: 10,
          ok: 'Tortie'
        },
        '11': {
          id: 11,
          ok: 'Brown Brindle/White'
        },
        '12': {
          id: 12,
          ok: 'Cream Tabby'
        },
        '13': {
          id: 13,
          ok: 'White/Black'
        },
        '14': {
          id: 14,
          ok: 'Brown Tabby'
        },
        '15': {
          id: 15,
          ok: 'Brown Tabby'
        },
        '16': {
          id: 16,
          ok: 'Brown Tabby'
        },
        '17': {
          id: 17,
          ok: 'Orange Tabby'
        },
        '18': {
          id: 18,
          ok: 'Black/Brown'
        },
        '19': {
          id: 19,
          ok: 'Tan'
        },
        '20': {
          id: 20,
          ok: 'Red'
        },
        '21': {
          id: 21,
          ok: 'White/Brown Brindle'
        },
        '22': {
          id: 22,
          ok: 'Blue Merle'
        },
        '23': {
          id: 23,
          ok: 'Blue/White'
        },
        '24': {
          id: 24,
          ok: 'Gold/Brown'
        },
        '25': {
          id: 25,
          ok: 'Black/White'
        },
        '26': {
          id: 26,
          ok: 'Blue Tabby'
        },
        '27': {
          id: 27,
          ok: 'Black/White'
        },
        '28': {
          id: 28,
          ok: 'White/Brown'
        },
        '29': {
          id: 29,
          ok: 'Brown/White'
        },
        '30': {
          id: 30,
          ok: 'White/Brown'
        },
        '31': {
          id: 31,
          ok: 'Brown/White'
        },
        '32': {
          id: 32,
          ok: 'Tan'
        },
        '33': {
          id: 33,
          ok: 'Tan'
        },
        '34': {
          id: 34,
          ok: 'Tortie'
        },
        '35': {
          id: 35,
          ok: 'Tan/White'
        },
        '36': {
          id: 36,
          ok: 'Tricolor'
        },
        '37': {
          id: 37,
          ok: 'Tan/White'
        },
        '38': {
          id: 38,
          ok: 'Tricolor'
        },
        '39': {
          id: 39,
          ok: 'Black/Tan'
        },
        '40': {
          id: 40,
          ok: 'Black/White'
        },
        '41': {
          id: 41,
          ok: 'Black/White'
        },
        '42': {
          id: 42,
          ok: 'Brown/Red'
        },
        '43': {
          id: 43,
          ok: 'Brown'
        },
        '44': {
          id: 44,
          ok: 'Black/White'
        },
        '45': {
          id: 45,
          ok: 'Black/White'
        },
        '46': {
          id: 46,
          ok: 'Brown Tabby/White'
        },
        '47': {
          id: 47,
          ok: 'Cream/Tan'
        },
        '48': {
          id: 48,
          ok: 'Tan'
        },
        '49': {
          id: 49,
          ok: 'Black/Tan'
        }
      },
      '2122': {
        '0': {
          id: 0,
          ok: 'Neutered Male'
        },
        '1': {
          id: 1,
          ok: 'Intact Female'
        },
        '2': {
          id: 2,
          ok: 'Intact Male'
        },
        '3': {
          id: 3,
          ok: 'Intact Male'
        },
        '4': {
          id: 4,
          ok: 'Spayed Female'
        },
        '5': {
          id: 5,
          ok: 'Unknown'
        },
        '6': {
          id: 6,
          ok: 'Intact Male'
        },
        '7': {
          id: 7,
          ok: 'Intact Male'
        },
        '8': {
          id: 8,
          ok: 'Intact Female'
        },
        '9': {
          id: 9,
          ok: 'Intact Female'
        },
        '10': {
          id: 10,
          ok: 'Intact Female'
        },
        '11': {
          id: 11,
          ok: 'Intact Female'
        },
        '12': {
          id: 12,
          ok: 'Unknown'
        },
        '13': {
          id: 13,
          ok: 'Intact Female'
        },
        '14': {
          id: 14,
          ok: 'Unknown'
        },
        '15': {
          id: 15,
          ok: 'Intact Female'
        },
        '16': {
          id: 16,
          ok: 'Unknown'
        },
        '17': {
          id: 17,
          ok: 'Unknown'
        },
        '18': {
          id: 18,
          ok: 'Intact Female'
        },
        '19': {
          id: 19,
          ok: 'Neutered Male'
        },
        '20': {
          id: 20,
          ok: 'Intact Female'
        },
        '21': {
          id: 21,
          ok: 'Intact Male'
        },
        '22': {
          id: 22,
          ok: 'Intact Female'
        },
        '23': {
          id: 23,
          ok: 'Spayed Female'
        },
        '24': {
          id: 24,
          ok: 'Intact Male'
        },
        '25': {
          id: 25,
          ok: 'Intact Male'
        },
        '26': {
          id: 26,
          ok: 'Neutered Male'
        },
        '27': {
          id: 27,
          ok: 'Intact Female'
        },
        '28': {
          id: 28,
          ok: 'Intact Male'
        },
        '29': {
          id: 29,
          ok: 'Intact Male'
        },
        '30': {
          id: 30,
          ok: 'Intact Male'
        },
        '31': {
          id: 31,
          ok: 'Intact Male'
        },
        '32': {
          id: 32,
          ok: 'Spayed Female'
        },
        '33': {
          id: 33,
          ok: 'Intact Male'
        },
        '34': {
          id: 34,
          ok: 'Intact Female'
        },
        '35': {
          id: 35,
          ok: 'Neutered Male'
        },
        '36': {
          id: 36,
          ok: 'Intact Male'
        },
        '37': {
          id: 37,
          ok: 'Intact Male'
        },
        '38': {
          id: 38,
          ok: 'Intact Female'
        },
        '39': {
          id: 39,
          ok: 'Intact Male'
        },
        '40': {
          id: 40,
          ok: 'Intact Male'
        },
        '41': {
          id: 41,
          ok: 'Spayed Female'
        },
        '42': {
          id: 42,
          ok: 'Intact Male'
        },
        '43': {
          id: 43,
          ok: 'Intact Male'
        },
        '44': {
          id: 44,
          ok: 'Intact Female'
        },
        '45': {
          id: 45,
          ok: 'Intact Female'
        },
        '46': {
          id: 46,
          ok: 'Intact Male'
        },
        '47': {
          id: 47,
          ok: 'Intact Male'
        },
        '48': {
          id: 48,
          ok: 'Intact Female'
        },
        '49': {
          id: 49,
          ok: 'Intact Male'
        }
      },
      '2123': {
        '0': {
          id: 0,
          ok: '7 years'
        },
        '1': {
          id: 1,
          ok: '1 year'
        },
        '2': {
          id: 2,
          ok: '1 year'
        },
        '3': {
          id: 3,
          ok: '1 year'
        },
        '4': {
          id: 4,
          ok: '3 years'
        },
        '5': {
          id: 5,
          ok: '1 year'
        },
        '6': {
          id: 6,
          ok: '7 years'
        },
        '7': {
          id: 7,
          ok: '1 year'
        },
        '8': {
          id: 8,
          ok: '1 year'
        },
        '9': {
          id: 9,
          ok: '1 year'
        },
        '10': {
          id: 10,
          ok: '5 months'
        },
        '11': {
          id: 11,
          ok: '1 year'
        },
        '12': {
          id: 12,
          ok: '2 weeks'
        },
        '13': {
          id: 13,
          ok: '1 year'
        },
        '14': {
          id: 14,
          ok: '2 weeks'
        },
        '15': {
          id: 15,
          ok: '2 years'
        },
        '16': {
          id: 16,
          ok: '2 weeks'
        },
        '17': {
          id: 17,
          ok: '2 weeks'
        },
        '18': {
          id: 18,
          ok: '2 years'
        },
        '19': {
          id: 19,
          ok: '8 years'
        },
        '20': {
          id: 20,
          ok: '10 years'
        },
        '21': {
          id: 21,
          ok: '3 years'
        },
        '22': {
          id: 22,
          ok: '1 year'
        },
        '23': {
          id: 23,
          ok: '5 years'
        },
        '24': {
          id: 24,
          ok: '5 months'
        },
        '25': {
          id: 25,
          ok: '3 days'
        },
        '26': {
          id: 26,
          ok: '2 years'
        },
        '27': {
          id: 27,
          ok: '3 days'
        },
        '28': {
          id: 28,
          ok: '3 days'
        },
        '29': {
          id: 29,
          ok: '3 days'
        },
        '30': {
          id: 30,
          ok: '3 days'
        },
        '31': {
          id: 31,
          ok: '3 days'
        },
        '32': {
          id: 32,
          ok: '3 months'
        },
        '33': {
          id: 33,
          ok: '7 months'
        },
        '34': {
          id: 34,
          ok: '1 year'
        },
        '35': {
          id: 35,
          ok: '4 years'
        },
        '36': {
          id: 36,
          ok: '2 years'
        },
        '37': {
          id: 37,
          ok: '1 year'
        },
        '38': {
          id: 38,
          ok: '2 years'
        },
        '39': {
          id: 39,
          ok: '9 months'
        },
        '40': {
          id: 40,
          ok: '2 months'
        },
        '41': {
          id: 41,
          ok: '4 years'
        },
        '42': {
          id: 42,
          ok: '1 year'
        },
        '43': {
          id: 43,
          ok: '1 year'
        },
        '44': {
          id: 44,
          ok: '2 years'
        },
        '45': {
          id: 45,
          ok: '1 year'
        },
        '46': {
          id: 46,
          ok: '8 weeks'
        },
        '47': {
          id: 47,
          ok: '1 year'
        },
        '48': {
          id: 48,
          ok: '1 year'
        },
        '49': {
          id: 49,
          ok: '2 years'
        }
      },
      '2124': {
        '0': {
          id: 0,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A595045'
        },
        '1': {
          id: 1,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745842'
        },
        '2': {
          id: 2,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745853'
        },
        '3': {
          id: 3,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745848'
        },
        '4': {
          id: 4,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745861'
        },
        '5': {
          id: 5,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745912'
        },
        '6': {
          id: 6,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745932'
        },
        '7': {
          id: 7,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745938'
        },
        '8': {
          id: 8,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745940'
        },
        '9': {
          id: 9,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745924'
        },
        '10': {
          id: 10,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745926'
        },
        '11': {
          id: 11,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745963'
        },
        '12': {
          id: 12,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745969'
        },
        '13': {
          id: 13,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745972'
        },
        '14': {
          id: 14,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745966'
        },
        '15': {
          id: 15,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745544'
        },
        '16': {
          id: 16,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745967'
        },
        '17': {
          id: 17,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745968'
        },
        '18': {
          id: 18,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745971'
        },
        '19': {
          id: 19,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745987'
        },
        '20': {
          id: 20,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745991'
        },
        '21': {
          id: 21,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745992'
        },
        '22': {
          id: 22,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746003'
        },
        '23': {
          id: 23,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A696083'
        },
        '24': {
          id: 24,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746014'
        },
        '25': {
          id: 25,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746000'
        },
        '26': {
          id: 26,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745964'
        },
        '27': {
          id: 27,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746002'
        },
        '28': {
          id: 28,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746006'
        },
        '29': {
          id: 29,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746005'
        },
        '30': {
          id: 30,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746004'
        },
        '31': {
          id: 31,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746001'
        },
        '32': {
          id: 32,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746027'
        },
        '33': {
          id: 33,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746030'
        },
        '34': {
          id: 34,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746029'
        },
        '35': {
          id: 35,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A714773'
        },
        '36': {
          id: 36,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746011'
        },
        '37': {
          id: 37,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746028'
        },
        '38': {
          id: 38,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746010'
        },
        '39': {
          id: 39,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746026'
        },
        '40': {
          id: 40,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746039'
        },
        '41': {
          id: 41,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A694334'
        },
        '42': {
          id: 42,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746050'
        },
        '43': {
          id: 43,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746052'
        },
        '44': {
          id: 44,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746060'
        },
        '45': {
          id: 45,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746058'
        },
        '46': {
          id: 46,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746087'
        },
        '47': {
          id: 47,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A745970'
        },
        '48': {
          id: 48,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746091'
        },
        '49': {
          id: 49,
          ok: 'http://www.petharbor.com/pet.asp?uaid=ASTN.A746092'
        }
      }
    }
  },
  urlParams: {
    category: 'dataset',
    name: 'okokokokokok',
    fourfour: 'nn5w-zj56',
    revisionSeq: '0',
    sidebarSelection: 'log'
  }
};
