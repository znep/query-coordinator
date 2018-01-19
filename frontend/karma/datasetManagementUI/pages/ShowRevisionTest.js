import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import { ShowRevision } from 'datasetManagementUI/pages/ShowRevision/ShowRevision';
import { ShowRevisionProps } from '../data/defaultProps';

describe('ShowRevision page', () => {
  const defaultProps = {
    params: {
      fourfour: 'abcd-1234',
      revisionSeq: '0'
    },
    isPublishedDataset: false,
    readFromCore: false,
    hasOutputSchema: true
  };

  const component = shallow(<ShowRevision {...defaultProps} />);
  it('renders correctly', () => {
    assert.isTrue(component.find('.homeContainer').exists());
  });

  it('renders the SchemaPreview', () => {
    assert.isTrue(component.find('SchemaPreview').exists());
  });

  it('renders RowDetails', () => {
    assert.isTrue(component.find('RowDetails').exists());
  });

  it('renders the HomePaneSidebar', () => {
    component.setState({ recentActionsOpened: true });
    assert.isTrue(component.find('HomePaneSidebar').exists());
  });
});
