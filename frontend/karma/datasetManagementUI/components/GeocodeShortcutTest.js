import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import { GeocodeShortcut } from 'components/GeocodeShortcut/GeocodeShortcut';
import entities from 'data/entities';
import * as Selectors from 'selectors';

describe('components/GeocodeShortcut', () => {
  const defaultProps = {
    displayState: {
      type: 'NORMAL',
      pageNo: 1,
      outputSchemaId: 137
    },
    path: {
      sourceId: 114,
      inputSchemaId: 97,
      outputSchemaId: 137
    },
    inputColumns: Selectors.columnsForInputSchema(entities, 97),
    entities: entities,
    newOutputSchema: _.noop,
    redirectToOutputSchema: _.noop,
    onDismiss: sinon.spy(),
    showError: sinon.spy(),
    params: {}
  };

  it('renders', () => {
    const component = shallow(<GeocodeShortcut {...defaultProps} />);
    assert.isTrue(component.find('ColumnPreview').exists());
  });

  it('generates an expression correctly for geocode/4', () => {
    const component = shallow(<GeocodeShortcut {...defaultProps} />);

    const outputColumns = entities.output_schemas[137].output_columns;
    component
      .instance()
      .setMapping(
        'address',
        _.find(outputColumns, oc => oc.field_name === 'block')
      );
    component
      .instance()
      .setMapping(
        'city',
        _.find(outputColumns, oc => oc.field_name === 'iucr')
      );
    component
      .instance()
      .setMapping(
        'state',
        _.find(outputColumns, oc => oc.field_name === 'domestic')
      );
    component
      .instance()
      .setMapping(
        'zip',
        _.find(outputColumns, oc => oc.field_name === 'community_area')
      );

    assert.equal(
      component.instance().genNewExpression().replace(/\s/g, ''),
      'make_location(\
        `block`,\
        `iucr`,\
        to_text(to_boolean(`domestic`)),\
        to_text(to_number(`community_area`)),\
        geocode(`block`, `iucr`, to_text(to_boolean(`domestic`)), to_text(to_number(`community_area`)))\
      )'.replace(
        /\s/g,
        ''
      )
    );
  });

  it('generates an expression correctly for geocode/1', () => {
    const component = shallow(<GeocodeShortcut {...defaultProps} />);
    const instance = component.instance();
    instance.setState({ ...instance.state, composedFrom: 'COMBINED' });
    const outputColumns = entities.output_schemas[137].output_columns;

    component
      .instance()
      .setMapping(
        'full_address',
        _.find(outputColumns, oc => oc.field_name === 'block')
      );
    assert.equal(
      component.instance().genNewExpression().replace(/\s/g, ''),
      'geocode(to_location(`block`))'.replace(/\s/g, '')
    );
  });

  it('generates an expression correctly for make_point/2', () => {
    const component = shallow(<GeocodeShortcut {...defaultProps} />);
    const instance = component.instance();
    instance.setState({ ...instance.state, composedFrom: 'LATLNG' });
    const outputColumns = entities.output_schemas[137].output_columns;

    component
      .instance()
      .setMapping(
        'latitude',
        _.find(outputColumns, oc => oc.field_name === 'block')
      );
    component
      .instance()
      .setMapping(
        'longitude',
        _.find(outputColumns, oc => oc.field_name === 'ward')
      );

    assert.equal(
      component.instance().genNewExpression().replace(/\s/g, ''),
      //make_point/2 is lat, lng ;_;
      'make_location(make_point(to_number(`block`), to_number(`ward`)))'.replace(
        /\s/g,
        ''
      )
    );
  });

  it('generates an expression correctly for geocode/4 something with constants', () => {
    const component = shallow(<GeocodeShortcut {...defaultProps} />);

    const outputColumns = entities.output_schemas[137].output_columns;
    component
      .instance()
      .setMapping(
        'address',
        _.find(outputColumns, oc => oc.field_name === 'block')
      );
    component
      .instance()
      .setMapping(
        'city',
        _.find(outputColumns, oc => oc.field_name === 'iucr')
      );
    component
      .instance()
      .setMapping(
        'state',
        'WA'
      );
    component
      .instance()
      .setMapping(
        'zip',
        _.find(outputColumns, oc => oc.field_name === 'community_area')
      );

    assert.equal(
      component.instance().genNewExpression().replace(/\s/g, ''),
      'make_location(\
        `block`,\
        `iucr`,\
        "WA",\
        to_text(to_number(`community_area`)),\
        geocode(`block`, `iucr`, "WA", to_text(to_number(`community_area`)))\
      )'.replace(
        /\s/g,
        ''
      )
    );
  });

  it('wraps generated expression in forgive when the user asks', () => {
    const component = shallow(<GeocodeShortcut {...defaultProps} />);
    const instance = component.instance();
    instance.setState({ ...instance.state, composedFrom: 'COMBINED' });
    const outputColumns = entities.output_schemas[137].output_columns;

    component
      .instance()
      .setMapping(
        'full_address',
        _.find(outputColumns, oc => oc.field_name === 'block')
      );
    instance.toggleConvertToNull();
    assert.equal(
      component.instance().genNewExpression().replace(/\s/g, ''),
      'forgive(geocode(to_location(`block`)))'.replace(/\s/g, '')
    );
  });

  it('sets the mapping correctly from the AST of geocode/4', () => {
    const outputColumn = {
      position: 4,
      is_primary_key: false,
      id: 99999,
      field_name: 'geocoded_column',
      display_name: 'Geocoded!',
      description: 'this column is geocoded from: ',
      transform_id: 99999
    };

    const outputSchemaColumn = {
      output_schema_id: defaultProps.path.outputSchemaId,
      output_column_id: 99999,
      is_primary_key: false
    };

    const transform = {
      transform_input_columns: [
        {
          input_column_id: 16502
        },
        {
          input_column_id: 16503
        },
        {
          input_column_id: 16504
        },
        {
          input_column_id: 16505
        }
      ],
      transform_expr: 'forgive(geocode(`address`, `city`, `state`, `zip`))',
      parsed_expr: {
        type: 'funcall',
        function_name: 'forgive',
        args: [
          {
            type: 'funcall',
            function_name: 'geocode',
            args: [
              {
                type: 'funcall',
                function_name: 'to_boolean',
                args: [
                  {
                    value: 'domestic',
                    type: 'column_ref'
                  }
                ]
              },
              {
                type: 'funcall',
                function_name: 'to_number',
                args: [{ value: 'district', type: 'column_ref' }]
              },
              {
                type: 'funcall',
                function_name: 'to_number',
                args: [{ value: 'beat', type: 'column_ref' }]
              },
              {
                type: 'funcall',
                function_name: 'to_number',
                args: [{ value: 'ward', type: 'column_ref' }]
              }
            ]
          }
        ]
      },
      output_soql_type: 'point',
      id: 16694,
      failed_at: null,
      completed_at: null,
      attempts: 0,
      error_indices: [],
      contiguous_rows_processed: 4
    };

    const withGeocode = {
      ...entities,
      output_columns: { ...entities.output_columns, 99999: outputColumn },
      output_schema_columns: {
        ...entities.output_schema_columns,
        '137-99999': outputSchemaColumn
      },
      transforms: { ...entities.transforms, 99999: transform }
    };

    const props = { ...defaultProps, entities: withGeocode };

    const component = shallow(<GeocodeShortcut {...props} />);

    const names = ['address', 'city', 'state', 'zip'];
    assert.deepEqual(
      component
        .instance()
        .state.mappings.filter(([name, _]) => names.indexOf(name) >= 0)
        .map(([name, { id }]) => [name, id]),
      [['address', 1930], ['city', 1932], ['state', 1931], ['zip', 1933]]
    );
  });

  it('sets the mapping correctly from the AST of geocode/1', () => {
    const outputColumn = {
      position: 4,
      is_primary_key: false,
      id: 99999,
      field_name: 'geocoded_column',
      display_name: 'Geocoded!',
      description: 'this column is geocoded from: ',
      transform_id: 99999
    };

    const outputSchemaColumn = {
      output_schema_id: defaultProps.path.outputSchemaId,
      output_column_id: 99999,
      is_primary_key: false
    };

    const transform = {
      transform_input_columns: [
        {
          input_column_id: 16502
        },
        {
          input_column_id: 16503
        },
        {
          input_column_id: 16504
        },
        {
          input_column_id: 16505
        }
      ],
      transform_expr: 'location_to_point(geocode(to_location(`ward`)))',
      parsed_expr: {
        type: 'funcall',
        function_name: 'location_to_point',
        args: [
          {
            type: 'funcall',
            function_name: 'geocode',
            args: [
              {
                type: 'funcall',
                function_name: 'to_location',
                args: [
                  {
                    type: 'funcall',
                    function_name: 'to_number',
                    args: [{ value: 'ward', type: 'column_ref' }]
                  }
                ]
              }
            ]
          }
        ]
      },
      output_soql_type: 'point',
      id: 16694,
      failed_at: null,
      completed_at: null,
      attempts: 0,
      error_indices: [],
      contiguous_rows_processed: 4
    };

    const withGeocode = {
      ...entities,
      output_columns: { ...entities.output_columns, 99999: outputColumn },
      output_schema_columns: {
        ...entities.output_schema_columns,
        '137-99999': outputSchemaColumn
      },
      transforms: { ...entities.transforms, 99999: transform }
    };

    const props = { ...defaultProps, entities: withGeocode };

    const component = shallow(<GeocodeShortcut {...props} />);

    const names = ['full_address'];
    assert.deepEqual(
      component
        .instance()
        .state.mappings.filter(([name, _]) => names.indexOf(name) >= 0)
        .map(([name, { id }]) => [name, id]),
      [['full_address', 1933]]
    );
  });

  it('sets the mapping correctly from the AST of make_point/2', () => {
    const outputColumn = {
      position: 4,
      is_primary_key: false,
      id: 99999,
      field_name: 'geocoded_column',
      display_name: 'Geocoded!',
      description: 'this column is geocoded from: ',
      transform_id: 99999
    };

    const outputSchemaColumn = {
      output_schema_id: defaultProps.path.outputSchemaId,
      output_column_id: 99999,
      is_primary_key: false
    };

    const transform = {
      transform_input_columns: [
        {
          input_column_id: 16502
        },
        {
          input_column_id: 16503
        },
        {
          input_column_id: 16504
        },
        {
          input_column_id: 16505
        }
      ],
      transform_expr: 'make_point(to_number(`district`), to_number(`ward`))',
      parsed_expr: {
        type: 'funcall',
        function_name: 'make_point',
        args: [
          {
            type: 'funcall',
            function_name: 'to_number',
            args: [
              {
                value: 'district',
                type: 'column_ref'
              }
            ]
          },
          {
            type: 'funcall',
            function_name: 'to_number',
            args: [
              {
                value: 'ward',
                type: 'column_ref'
              }
            ]
          }
        ]
      },
      output_soql_type: 'point',
      id: 16694,
      failed_at: null,
      completed_at: null,
      attempts: 0,
      error_indices: [],
      contiguous_rows_processed: 4
    };

    const withGeocode = {
      ...entities,
      output_columns: { ...entities.output_columns, 99999: outputColumn },
      output_schema_columns: {
        ...entities.output_schema_columns,
        '137-99999': outputSchemaColumn
      },
      transforms: { ...entities.transforms, 99999: transform }
    };

    const props = { ...defaultProps, entities: withGeocode };

    const component = shallow(<GeocodeShortcut {...props} />);

    const names = ['latitude', 'longitude'];
    assert.deepEqual(
      component
        .instance()
        .state.mappings.filter(([name, _]) => names.indexOf(name) >= 0)
        .map(([name, { id }]) => [name, id]),
      [['latitude', 1932], ['longitude', 1933]]
    );
  });

  it('shows a configuration error when using geocoding dialog on something that has a complex make_point or geocoding expression', () => {
    const outputColumn = {
      position: 4,
      is_primary_key: false,
      id: 99999,
      field_name: 'geocoded_column',
      display_name: 'Geocoded!',
      description: 'this column is geocoded from: ',
      transform_id: 99999
    };

    const outputSchemaColumn = {
      output_schema_id: defaultProps.path.outputSchemaId,
      output_column_id: 99999,
      is_primary_key: false
    };

    const transform = {
      transform_input_columns: [
        {
          input_column_id: 16502
        },
        {
          input_column_id: 16503
        },
        {
          input_column_id: 16504
        },
        {
          input_column_id: 16505
        }
      ],
      transform_expr: 'geocode(`foo`, `bar`)',
      parsed_expr: {
        type: 'funcall',
        function_name: 'geocode',
        args: [
          {
            value: 'foo',
            type: 'column_ref'
          },
          {
            value: 'bar',
            type: 'column_ref'
          }
        ]
      },
      output_soql_type: 'point',
      id: 16694,
      failed_at: null,
      completed_at: null,
      attempts: 0,
      error_indices: [],
      contiguous_rows_processed: 4
    };

    const withGeocode = {
      ...entities,
      output_columns: { ...entities.output_columns, 99999: outputColumn },
      output_schema_columns: {
        ...entities.output_schema_columns,
        '137-99999': outputSchemaColumn
      },
      transforms: { ...entities.transforms, 99999: transform }
    };

    const props = { ...defaultProps, entities: withGeocode };

    const component = shallow(<GeocodeShortcut {...props} />);

    assert.isTrue(component.find('.configurationError').exists());
  });

  it('hides the original columns when the user asks', () => {
    const component = shallow(<GeocodeShortcut {...defaultProps} />);

    const outputColumns = entities.output_schemas[137].output_columns;
    component
      .instance()
      .setMapping(
        'address',
        _.find(outputColumns, oc => oc.field_name === 'block')
      );
    component
      .instance()
      .setMapping(
        'city',
        _.find(outputColumns, oc => oc.field_name === 'iucr')
      );
    component
      .instance()
      .setMapping(
        'state',
        _.find(outputColumns, oc => oc.field_name === 'domestic')
      );
    component
      .instance()
      .setMapping(
        'zip',
        _.find(outputColumns, oc => oc.field_name === 'community_area')
      );

    component.instance().toggleHideOriginal();

    const newOutputColumnNames = component
      .instance()
      .genDesiredColumns()
      .map(oc => oc.field_name);

    assert.notInclude(newOutputColumnNames, 'block');
    assert.notInclude(newOutputColumnNames, 'iucr');
    assert.notInclude(newOutputColumnNames, 'domestic');
    assert.notInclude(newOutputColumnNames, 'community_area');
  });
});
