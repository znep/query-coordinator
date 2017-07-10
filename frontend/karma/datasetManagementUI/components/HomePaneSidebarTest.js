import { assert, expect } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import rootReducer from 'reducers/rootReducer';
import { bootstrapApp } from 'actions/bootstrap';
import { editView } from 'actions/views';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import HomePaneSidebar, { ManageData } from 'components/HomePaneSidebar';
import wsmock from '../testHelpers/mockSocket';

describe('components/HomePaneSidebar', () => {
  let store;
  let unmockWS;

  before(() => {
    unmockWS = wsmock();
  });

  after(() => {
    unmockWS.stop();
  });

  beforeEach(() => {
    store = createStore(rootReducer, applyMiddleware(thunk));
    store.dispatch(
      bootstrapApp(
        window.initialState.view,
        window.initialState.revision,
        window.initialState.customMetadataFieldsets
      )
    );
  });

  it("shows a disabled 'Describe Columns' button if columnsExist is falsey", () => {
    const defaultProps = {
      entities: {
        __loads__: {},
        views: {
          's396-jk8m': {
            id: 's396-jk8m',
            name: 'vsgfdfg',
            viewCount: 0,
            downloadCount: 0,
            license: {},
            __status__: {
              type: 'SAVED',
              savedAt: 'ON_SERVER'
            }
          }
        },
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
      columnsExist: false
    };

    const component = shallow(<ManageData {...defaultProps} />);

    assert.isOk(component.find('button').first().prop('disabled'));
  });

  it('shows 0 checkmarks when nothing is done', () => {
    const props = {
      urlParams: {
        sidebarSelection: null
      }
    };

    const element = renderComponentWithStore(HomePaneSidebar, props, store);
    expect(element.querySelectorAll('span.finished').length).to.equal(0);
  });

  it('shows the activity feed when the url says to', () => {
    const props = {
      urlParams: {
        sidebarSelection: 'log'
      }
    };

    const element = renderComponentWithStore(HomePaneSidebar, props, store);
    assert.ok(element.querySelectorAll('.activity-feed'));
  });
});
