import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import FormatColumn from 'components/FormatColumn/FormatColumn';
import entities from 'data/entities';
import * as Selectors from 'selectors';

describe('components/FormatColumn', () => {
  const os = entities.output_schemas['138'];
  const defaultProps = {
    displayState: {
      type: 'NORMAL',
      pageNo: 1,
      outputSchemaId: 137
    },
    params: {
      sourceId: 114,
      inputSchemaId: 97,
      outputSchemaId: 137
    },
    entities: entities,
    outputColumn: os.output_columns[0],
    outputSchema: os,
    inputSchema: entities.input_schemas[os.input_schema_id],
    onDismiss: sinon.spy(),
    onSave: sinon.spy()
  };


  it('renders', () => {
    const component = shallow(<FormatColumn {...defaultProps} />);
    assert.isTrue(component.find('Content').exists());
    assert.isTrue(component.find('FormatPreview').exists());
  });

  it('renders NumberColumnFormat when type == number', () => {
    const component = shallow(<FormatColumn {...defaultProps} />);
    assert.isTrue(component.find('NumberColumnFormat').exists());
  });

  it('renders TextColumnFormat when type == text', () => {
    const component = shallow(<FormatColumn {...{...defaultProps, outputColumn: os.output_columns[1] }} />);
    assert.isTrue(component.find('TextColumnFormat').exists());
  });

  it('renders DatetimeColumnFormat when type == text', () => {
    const component = shallow(<FormatColumn {...{...defaultProps, outputColumn: os.output_columns[2] }} />);
    assert.isTrue(component.find('DatetimeColumnFormat').exists());
  });
});
