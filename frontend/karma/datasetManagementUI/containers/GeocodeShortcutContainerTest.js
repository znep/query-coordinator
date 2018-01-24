import PropTypes from 'prop-types';
import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import { genNewExpression, mapStateToProps, sortOutputColumns } from 'datasetManagementUI/containers/GeocodeShortcutContainer';
import entities from 'data/entities';
import * as Selectors from 'datasetManagementUI/selectors';
import { mount } from 'enzyme';
import { createStore, applyMiddleware } from 'redux';
import reducer from 'datasetManagementUI/reduxStuff/reducers/rootReducer';
import initialState from '../data/initialState';
import thunk from 'redux-thunk';

window.serverConfig.featureFlags.ingress_strategy = 'obe';

describe('containers/GeocodeShortcutContainer', () => {

  const outputColumns = entities.output_schemas[137].output_columns;
  const view = entities.views['ky4m-3w3d'];


  const defaultProps = {
    displayState: {
      type: 'NORMAL',
      pageNo: 1,
      outputSchemaId: 137
    },
    params: {
      fourfour: 'ky4m-3w3d',
      sourceId: 114,
      inputSchemaId: 97,
      outputSchemaId: 137
    },
    location: {
      pathname: 'unused'
    },
    view: entities.views['ky4m-3w3d'],
    inputColumns: Selectors.columnsForInputSchema(entities, 97)
  };

  it('generates an expression correctly for geocode/4', () => {
    const formState = {
      composedFrom: 'COMPONENTS',
      mappings: [
        ['address', _.find(outputColumns, oc => oc.field_name === 'block')],
        ['city', _.find(outputColumns, oc => oc.field_name === 'iucr')],
        ['state', _.find(outputColumns, oc => oc.field_name === 'domestic')],
        ['zip', _.find(outputColumns, oc => oc.field_name === 'community_area')]
      ]
    }

    assert.equal(
      genNewExpression(view, formState).replace(/\s/g, ''),
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
    const formState = {
      composedFrom: 'COMBINED',
      mappings: [
        ['full_address', _.find(outputColumns, oc => oc.field_name === 'block')]
      ]
    }

    assert.equal(
      genNewExpression(view, formState).replace(/\s/g, ''),
      'geocode(to_location(`block`))'.replace(/\s/g, '')
    );
  });

  it('generates an expression correctly for make_point/2', () => {
    const formState = {
      composedFrom: 'LATLNG',
      mappings: [
        ['latitude', _.find(outputColumns, oc => oc.field_name === 'block')],
        ['longitude', _.find(outputColumns, oc => oc.field_name === 'ward')]
      ]
    }

    assert.equal(
      genNewExpression(view, formState).replace(/\s/g, ''),
      //make_point/2 is lat, lng ;_;
      'make_location(make_point(to_number(`block`), to_number(`ward`)))'.replace(
        /\s/g,
        ''
      )
    );
  });

  it('generates an expression correctly for geocode/4 with constants', () => {
    const formState = {
      composedFrom: 'COMPONENTS',
      mappings: [
        ['address', _.find(outputColumns, oc => oc.field_name === 'block')],
        ['city', _.find(outputColumns, oc => oc.field_name === 'iucr')],
        ['state', 'WA'],
        ['zip', _.find(outputColumns, oc => oc.field_name === 'community_area')]
      ]
    }

    assert.equal(
      genNewExpression(view, formState).replace(/\s/g, ''),
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
    const formState = {
      composedFrom: 'COMBINED',
      shouldConvertToNull: true,
      mappings: [
        ['full_address', _.find(outputColumns, oc => oc.field_name === 'block')],
      ]
    }

    assert.equal(
      genNewExpression(view, formState).replace(/\s/g, ''),
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
      output_schema_id: defaultProps.params.outputSchemaId,
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

    const props = mapStateToProps({
      entities: withGeocode,
      ui: {
        forms: {
          geocodeShortcutForm: {
            state: {}
          }
        }
      }
    }, defaultProps)

    const names = ['address', 'city', 'state', 'zip'];

    assert.deepEqual(
      props.formState.mappings.filter(([name, _]) => names.indexOf(name) >= 0)
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
      output_schema_id: defaultProps.params.outputSchemaId,
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

    const props = mapStateToProps({
      entities: withGeocode,
      ui: {
        forms: {
          geocodeShortcutForm: {
            state: {}
          }
        }
      }
    }, defaultProps)

    const names = ['full_address'];
    assert.deepEqual(
      props.formState.mappings.filter(([name, _]) => names.indexOf(name) >= 0)
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
      output_schema_id: defaultProps.params.outputSchemaId,
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

    const props = mapStateToProps({
      entities: withGeocode,
      ui: {
        forms: {
          geocodeShortcutForm: {
            state: {}
          }
        }
      }
    }, defaultProps)

    const names = ['latitude', 'longitude'];
    assert.deepEqual(
      props.formState.mappings.filter(([name, _]) => names.indexOf(name) >= 0)
        .map(([name, { id }]) => [name, id]),
      [['latitude', 1932], ['longitude', 1933]]
    );
  });

  it('restores hides the original columns the original columns are not present', () => {
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
      output_schema_id: defaultProps.params.outputSchemaId,
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

    const excluded = [1924, 1925, 1930, 1934]
    let outputSchemaColumns = _.filter(
      entities.output_schema_columns,
      (osc) => excluded.indexOf(osc.id) === -1
    );

    const withGeocode = {
      ...entities,
      output_columns: { ...entities.output_columns, 99999: outputColumn },
      output_schema_columns: outputSchemaColumns,
      transforms: { ...entities.transforms, 99999: transform }
    };

    const props = mapStateToProps({
      entities: withGeocode,
      ui: {
        forms: {
          geocodeShortcutForm: {
            state: {}
          }
        }
      }
    }, defaultProps)

    assert.isTrue(props.formState.shouldHideOriginal);
  });

  describe('sortOutputColumns', () => {
    it('sorts the output colummns', () => {
      const outputCols = [
        { position: 1, field_name: "some_geo_column" },
        { position: 2, field_name: "zip" },
        { position: 3, field_name: "county" },
        { position: 4, field_name: "address" },
        { position: 5, field_name: "state" },
        { position: 6, field_name: "salary" }
      ]
      const initialOutputCols = ["address", "city", "zip", "state"]
      assert.deepEqual(sortOutputColumns(initialOutputCols, outputCols), [
        { position: 1, field_name: "address" },
        { position: 2, field_name: "zip" },
        { position: 3, field_name: "state" },
        { position: 4, field_name: "some_geo_column" },
        { position: 5, field_name: "county" },
        { position: 6, field_name: "salary" }
      ]);
    });
  });
});
