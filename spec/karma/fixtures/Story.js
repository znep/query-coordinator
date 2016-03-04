import _ from 'lodash';

export default function(overrides) {
  return _.extend({}, {
    uid: 'what-what',
    title: 'Title',
    description: 'Description',
    theme: 'classic',
    blocks: [
     {
        layout: '12',
        components: [
          { type: 'assetSelector' }
        ]
      },
      {
        layout: '12',
        components: [
          { type: 'html', value: 'some-text' }
        ]
      },
      {
        layout: '6-6',
        components: [
          { type: 'assetSelector' },
          { type: 'html', value: 'some-text' }
        ]
      },
      {
        components: [{
            'type': 'image',
            'value': {
              'url': 'https://sa-storyteller-dev-us-west-2-staging.s3.amazonaws.com/documents/uploads/000/000/005/original/q3e87zR.gif?1447210253',
              'documentId': 5
            }
        }]
      },
      {
        components: [{
          'type': 'socrata.visualization.classic',
          'value': {
            'visualization': {},
            'dataset': {
              'datasetUid': 'test-test',
              'domain': 'localhost'
            }
          }
        }]
      },
      {
        components: [{
          'type': 'socrata.visualization.columnChart',
          'value': {
            'vif': {
              'type': 'columnChart',
              'unit': {
                'one': 'record',
                'other': 'records'
              },
              'title': 'Type',
              'domain': 'localhost',
              'format': {
                'type': 'visualization_interchange_format',
                'version': 1
              },
              'origin': {
                'url': 'https://localhost/view/exha-s3yv',
                'type': 'data_lens_add_visualization_component'
              },
              'filters': null,
              'createdAt': '2015-11-11T22:40:19.866Z',
              'columnName': 'type',
              'datasetUid': 'exha-s3yv',
              'aggregation': {
                'field': null,
                'function': 'count'
              },
              'description': '',
              'configuration': {
                'columns': {
                  'name': 0,
                  'unfilteredValue': 1,
                  'filteredValue': 2,
                  'selected': 3
                },
                'localization': {
                  'NO_VALUE': '(No value)',
                  'FLYOUT_UNFILTERED_AMOUNT_LABEL': 'Total: ',
                  'FLYOUT_FILTERED_AMOUNT_LABEL': 'Filtered: ',
                  'FLYOUT_SELECTED_NOTICE': 'This column is currently selected.'
                }
              }
            },
            'dataset': {
              'domain': 'localhost',
              'datasetUid': 'exha-s3yv'
            }
          }
        }]
      },
      {
        components: [{
          'type': 'youtube.video',
          'value': {
            'id': 'S7vuwrb2v0M',
            'url': 'https://www.youtube.com/watch?v=S7vuwrb2v0M'
          }
        }]
      },
      {
        components: [{
          'type': 'author',
          'value': {
            'image': {
              'url': 'https://sa-storyteller-dev-us-west-2-staging.s3.amazonaws.com/documents/uploads/000/000/005/original/q3e87zR.gif?1447210253',
              'documentId': 5
            },
            'blurb': 'foobar'
          }
        }]
      },
      {
        components: [{
            'type': 'hero',
            'value': {
              'url': 'https://sa-storyteller-dev-us-west-2-staging.s3.amazonaws.com/documents/uploads/000/000/005/original/q3e87zR.gif?1447210253',
              'documentId': 5,
              'html': 'html content'
            }
        }]
      }
    ],
    digest: 'digest',
    permissions: {isPublic: false},
    createdBy: 'them-them'
  }, overrides);
}
