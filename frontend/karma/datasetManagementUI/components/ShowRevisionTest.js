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

  it('renders manage data link', () => {
    assert.isFalse(component.find('.manageDataBtn').isEmpty());
  });

  it('renders list of accepted file types', () => {
    const clonedProps = _.cloneDeep(ShowRevisionProps);
    clonedProps.entities.output_schemas = {};
    clonedProps.entities.input_schemas = {};
    clonedProps.entities.uploads = {};
    clonedProps.entities.task_sets = {};

    const theComponent = shallow(<ShowRevision {...clonedProps} />);
    assert.equal(
      theComponent.find('WrapDataTablePlaceholder').dive().find('.fileTypes').text(),
      'Supported file types: .csv, .tsv, .xls, .xlsx'
    );
  });

});
