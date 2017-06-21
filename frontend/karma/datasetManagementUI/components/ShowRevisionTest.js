import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import { ShowRevision } from 'components/ShowRevision';
import _ from 'lodash';
import { ShowRevisionProps } from '../data/defaultProps'

describe('components/ShowRevision', () => {
  const defaultProps = ShowRevisionProps;

  const component = shallow(<ShowRevision {...defaultProps} />);

  it('renders correctly', () => {
    assert.isFalse(component.find('.homeContainer').isEmpty());
  });

  it('renders the InfoPane', () => {
    assert.isFalse(component.find('InfoPane').isEmpty());
  });

  it('renders the MetadataTable', () => {
    assert.isFalse(component.find('MetadataTable').isEmpty());
  });

  it('renders the SchemaPreview', () => {
    assert.isFalse(component.find('Connect(SchemaPreview)').isEmpty());
  });

  it('renders RowDetails', () => {
    assert.isFalse(component.find('Connect(RowDetails)').isEmpty());
  });

  it('renders the HomePaneSidebar', () => {
    assert.isFalse(component.find('Connect(HomePaneSidebar)').isEmpty());
  });

  it('renders manange data link', () => {
    assert.isFalse(component.find('.manageDataBtn').isEmpty());
  });
});
