import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import { ShowSource, mapStateToProps } from 'datasetManagementUI/pages/ShowSource/ShowSource';
import _ from 'lodash';
import dotProp from 'dot-prop-immutable';
import state from '../data/initialState';

describe('ShowSource page', () => {
  const defaultProps = {
    goHome: _.noop,
    inProgress: false,
    hrefFormDirty: false,
    saveHrefForm: () => {},
    schemaExists: false,
    onHrefPage: false
  };

  const ownProps = {
    params: {
      revisionSeq: '0'
    },
    routes: [
      {
        path: '/dataset/jjjj/fz3i-57sq/revisions/0'
      }
    ]
  };

  const component = shallow(
    <ShowSource {...defaultProps}>
      <span className="child">hey</span>
    </ShowSource>
  );

  it('renders a modal', () => {
    assert.equal(component.find('Modal').length, 1);
  });

  it('renders a spinner if in progress', () => {
    const newProps = {
      ...defaultProps,
      children: {},
      inProgress: true
    };

    const component = shallow(<ShowSource {...newProps} />);

    assert.equal(component.find('.spinner').length, 1);
  });

  it('renders SourceSidebar and any children if not in progress', () => {
    const child = component.find('.child');
    const sidebar = component.find('withRouter(Connect(SourceSidebar))');

    assert.isTrue(child.exists());
    assert.isTrue(sidebar.exists());
  });

  it('sets inProgress to false if there is no source', () => {
    const newState = dotProp.set(state, 'entities.sources', {});
    const { inProgress } = mapStateToProps(newState, ownProps);
    assert.isFalse(inProgress);
  });

  it('sets inProgress to true if there is an UPLOAD_FILE api call in progress', () => {
    const sourceId = Number(Object.keys(state.entities.sources)[0]);

    const newState = dotProp.set(state, `entities.sources.${sourceId}`, {
      finished_at: null,
      failed_at: null
    });
    const { inProgress } = mapStateToProps(newState, ownProps);
    assert.isTrue(inProgress);
  });
});
