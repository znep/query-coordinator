import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import rootReducer from 'reducers/rootReducer';
import { bootstrapApp } from 'actions/bootstrap';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import { ManageData, HomePaneSidebar } from 'components/HomePaneSidebar';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';

describe('components/HomePaneSidebar', () => {
  let store;

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

  const socket = mockSocket(bootstrapChannels);

  beforeEach(() => {
    store = createStore(
      rootReducer,
      applyMiddleware(thunk.withExtraArgument(socket))
    );
    store.dispatch(
      bootstrapApp(
        window.initialState.view,
        window.initialState.revision,
        window.initialState.customMetadataFieldsets
      )
    );
  });

  it("shows a disabled 'Describe Columns' button if columnsExist is falsey", () => {
    const component = shallow(<ManageData {...defaultProps} />);

    assert.isOk(component.find('button').first().prop('disabled'));
  });

  it('shows 0 checkmarks when nothing is done', () => {
    const component = shallow(<ManageData {...defaultProps} />);

    assert.equal(component.find('.finished').length, 0);
  });

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
