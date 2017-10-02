import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import { ShowRevision } from 'pages/ShowRevision/ShowRevision';
import _ from 'lodash';
import { ShowRevisionProps } from '../data/defaultProps';

describe('ShowRevision page', () => {
  const defaultProps = {
    params: {
      fourfour: 'abcd-1234',
      revisionSeq: '0'
    },
    isPublishedDataset: false
  };

  const component = shallow(<ShowRevision {...defaultProps} />);
  it('renders correctly', () => {
    assert.isTrue(component.find('.homeContainer').exists());
  });

  it('renders the SchemaPreview', () => {
    assert.isTrue(
      component.find('SchemaPreview').exists()
    );
  });

  it('renders RowDetails', () => {
    assert.isTrue(component.find('RowDetails').exists());
  });

  it('renders the HomePaneSidebar', () => {
    assert.isTrue(
      component.find('withRouter(Connect(HomePaneSidebar))').exists()
    );
  });
});
