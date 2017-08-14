import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import HomePaneSidebar from 'components/HomePaneSidebar/HomePaneSidebar';

describe('components/HomePaneSidebar', () => {

  const defaultProps = {
    entities: {
      views: {
        's396-jk8m': {
          id: 's396-jk8m',
          name: 'vsgfdfg',
          viewCount: 0,
          downloadCount: 0,
          license: {}
        }
      },
      revisions: {
        '317': {
          id: 317,
          fourfour: 's396-jk8m',
          permission: 'public',
          task_sets: [],
          revision_seq: 0,
          output_schema_id: null,
          created_at: '2017-08-10T21:33:14.893Z',
          created_by: {
            user_id: 'tugg-ikce',
            email: 'test@socrata.com',
            display_name: 'test'
          }
        }
      },
      updates: {},
      sources: {},
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
    columnsExist: false,
    params: {
      category: 'dataset',
      name: 'dfsdfdsf',
      fourfour: 'kg5j-unyr',
      revisionSeq: '0',
      sourceId: '115',
      inputSchemaId: '98',
      outputSchemaId: '144',
      sidebarSelection: null
    }
  };

  it('shows the activity feed by default', () => {
    const component = shallow(<HomePaneSidebar {...defaultProps} />);

    assert.isAtLeast(
      component.find('withRouter(Connect(RecentActions))').length,
      1
    );
  });

  it('shows the manage actions when the url says to', () => {
    const props = {
      ...defaultProps,
      params: {
        ...defaultProps.params,
        sidebarSelection: 'manageTab'
      }
    };

    const component = shallow(<HomePaneSidebar {...props} />);

    assert.isAtLeast(component.find('ManageData').length, 1);
  });
});
