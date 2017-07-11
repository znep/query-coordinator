import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import { ShowUpload, mapStateToProps } from 'components/ShowUpload';
import _ from 'lodash';
import dotProp from 'dot-prop-immutable';
import state from '../data/initialState';

describe('components/ShowUpload', () => {
  const defaultProps = {
    goHome: _.noop,
    inProgress: false
  };

  const component = shallow(<ShowUpload {...defaultProps} />);

  it('renders a modal', () => {
    assert.equal(component.find('Modal').length, 1);
  });

  it('renders a spinner if in progress', () => {
    const newProps = {
      ...defaultProps,
      inProgress: true
    };

    const component = shallow(<ShowUpload {...newProps} />);

    assert.equal(component.find('.spinner').length, 1);
  });

  it('renders Upload index page if not in progress', () => {
    const dragDrop = component.find('Connect(DragDropUpload)');
    const sidebar = component.find('Connect(UploadSidebar)');

    assert.equal(dragDrop.length, 1);
    assert.equal(sidebar.length, 1);
  });

  it('sets inProgress to false if there is no source', () => {
    const newState = dotProp.set(state, 'entities.sources', {});
    const { inProgress } = mapStateToProps(newState);
    assert.isFalse(inProgress);
  });

  it('sets inProgress to true if there is an UPLOAD_FILE api call in progress', () => {
    const sourceId = Number(Object.keys(state.entities.sources)[0]);
    const newState = dotProp.set(state, 'ui.apiCalls', {
      '1234abcd': {
        operation: 'UPLOAD_FILE',
        status: 'STATUS_CALL_IN_PROGRESS',
        params: { id: sourceId }
      }
    });
    const { inProgress } = mapStateToProps(newState);
    assert.isTrue(inProgress);
  });
});
