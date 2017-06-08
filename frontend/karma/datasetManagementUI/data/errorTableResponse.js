import _ from 'lodash';

export const rowErrorResponse = [
  {
    offset: 0,
    error: {
      contents: ["I'm the empty error!"]
    }
  },
  {
    offset: 1,
    error: {
      contents: ["I'm the lonliest error!"]
    }
  },
  {
    offset: 4,
    error: {
      contents: ["I'm an error to life, the universe an everything!"]
    }
  }
];

export const columnErrorResponse = [
  {
    output_columns: [
      { id: 50, transform: { id: 1 } },
      { id: 51, transform: { id: 2 } }
    ]
  },
  {
    offset: 0,
    row: [
      {
        error: {
          inputs: {
            arrest: {
              ok: '031A'
            }
          },
          message: 'Failed to convert "031A" to number'
        }
      },
      {
        ok: 'foo'
      }
    ]
  },
  {
    offset: 7,
    row: [
      {
        error: {
          inputs: {
            arrest: {
              ok: '031A'
            }
          },
          message: 'Failed to convert "031A" to number'
        }
      },
      {
        ok: 'bar'
      }
    ]
  }
];

export const columnErrorResponseLaterPage = [
  {
    output_columns: [
      { id: 50, transform: { id: 1 } },
      { id: 51, transform: { id: 2 } }
    ]
  },
  {
    offset: 8001,
    row: [
      {
        error: {
          inputs: {
            arrest: {
              ok: '031A'
            }
          },
          message: 'Failed to convert "031A" to number'
        }
      },
      {
        ok: 'foo'
      }
    ]
  },
  {
    offset: 9000,
    row: [
      {
        error: {
          inputs: {
            arrest: {
              ok: '031A'
            }
          },
          message: 'Failed to convert "031A" to number'
        }
      },
      {
        ok: 'bar'
      }
    ]
  }
];

export const normalWithErrorsResponse = _.concat([
  {
    output_columns: [
      { transform: { id: 1 } },
      { transform: { id: 2 } }
    ]
  },
  {
    offset: 2,
    row: [{ ok: '2' }, { ok: 'it takes two to tango' }]
  },
  {
    offset: 3,
    row: [{ ok: '3' }, { ok: 'three is a crowd' }]
  }
], rowErrorResponse);
