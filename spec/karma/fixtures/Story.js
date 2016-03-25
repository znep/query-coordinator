import _ from 'lodash';

var assetSelector = {
  type: 'assetSelector'
};

var html = {
  type: 'html',
  value: 'some-text'
};

var image = {
  'type': 'image',
  'value': {
    'url': 'https://sa-storyteller-dev-us-west-2-staging.s3.amazonaws.com/documents/uploads/000/000/005/original/q3e87zR.gif?1447210253',
    'documentId': 5
  }
};

var classicChart = {
  'type': 'socrata.visualization.classic',
  'value': {
    'visualization': {},
    'dataset': {
      'datasetUid': 'test-test',
      'domain': 'localhost'
    }
  }
};

var youtube = {
  'type': 'youtube.video',
  'value': {
    'id': 'S7vuwrb2v0M',
    'url': 'https://www.youtube.com/watch?v=S7vuwrb2v0M'
  }
};

var author = {
  'type': 'author',
  'value': {
    'image': {
      'url': 'https://sa-storyteller-dev-us-west-2-staging.s3.amazonaws.com/documents/uploads/000/000/005/original/q3e87zR.gif?1447210253',
      'documentId': 5
    },
    'blurb': 'foobar'
  }
};

var hero = {
  'type': 'hero',
  'value': {
    'url': 'https://sa-storyteller-dev-us-west-2-staging.s3.amazonaws.com/documents/uploads/000/000/005/original/q3e87zR.gif?1447210253',
    'documentId': 5,
    'html': 'html content'
  }
};

var columnChart = {
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
};

export default function(overrides) {
  return _.extend({}, {
    uid: 'what-what',
    title: 'Title',
    description: 'Description',
    theme: 'classic',
    blocks: [
     { layout: '12', components: [assetSelector] },
     { layout: '12', components: [html] },
     { layout: '6-6', components: [assetSelector, html] },
     { layout: '12', components: [image] },
     { layout: '12', components: [classicChart] },
     { layout: '4-4-4', components: [columnChart, youtube, author] },
     { layut: '12', components: [hero] }
    ],
    digest: 'digest',
    permissions: {isPublic: false},
    createdBy: 'them-them'
  }, overrides);
}
