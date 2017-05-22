const initialState = {
  db: {
    __loads__: {},
    views: {},
    updates: {},
    uploads: {},
    input_schemas: {},
    output_schemas: {},
    input_columns: {},
    output_columns: {},
    output_schema_columns: {},
    transforms: {},
    upsert_jobs: {},
    email_interests: {},
    row_errors: {}
  },
  flashMessage: {
    message: '',
    kind: '',
    visible: false
  },
  notifications: [],
  modal: {
    visible: false,
    contentComponentName: null,
    payload: null
  },
  routing: {
    fourfour: 'tw7g-jnvn',
    outputSchemaId: 9908,
    history: [
      {
        pathname: '/dataset/lkl/tw7g-jnvn/revisions/0',
        search: '',
        hash: '',
        action: 'POP',
        key: null,
        query: {}
      },
      {
        pathname: '/dataset/lkl/tw7g-jnvn/revisions/0/uploads/8325/schemas/9649/output/9908',
        search: '',
        hash: '',
        action: 'PUSH',
        key: '0dyqa2',
        query: {}
      }
    ],
    location: {
      locationBeforeTransitions: {
        pathname: '/dataset/lkl/tw7g-jnvn/revisions/0/uploads/8325/schemas/9649/output/9908',
        search: '',
        hash: '',
        action: 'PUSH',
        key: '0dyqa2',
        query: {}
      }
    }
  },
  channels: {},
  apiCalls: {}
};

export default initialState;
