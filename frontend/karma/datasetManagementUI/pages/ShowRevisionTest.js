import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import { ShowRevision } from 'pages/ShowRevision/ShowRevision';
import _ from 'lodash';
import { ShowRevisionProps } from '../data/defaultProps';

describe('ShowRevision page', () => {
  const defaultProps = ShowRevisionProps;

  const component = shallow(<ShowRevision {...defaultProps} />);

  it('renders correctly', () => {
    assert.isFalse(component.find('.homeContainer').isEmpty());
  });

  it('renders the SchemaPreview', () => {
    assert.isFalse(
      component.find('withRouter(Connect(SchemaPreview))').isEmpty()
    );
  });

  it('renders RowDetails', () => {
    assert.isFalse(component.find('Connect(RowDetails)').isEmpty());
  });

  it('renders the HomePaneSidebar', () => {
    assert.isFalse(
      component.find('withRouter(Connect(HomePaneSidebar))').isEmpty()
    );
  });


  it('renders without errors when there is no output schema', () => {
    const propsWithoutOutputSchema = _.clone(defaultProps);
    propsWithoutOutputSchema.entities.output_schemas = {};
    propsWithoutOutputSchema.entities.input_schemas = {};
    propsWithoutOutputSchema.entities.task_sets = {};
    propsWithoutOutputSchema.entities.sources = {};
    const theComponent = shallow(
      <ShowRevision {...propsWithoutOutputSchema} />
    );
    assert.isFalse(theComponent.isEmpty());
  });
});
