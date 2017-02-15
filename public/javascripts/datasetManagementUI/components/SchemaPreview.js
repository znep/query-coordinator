import React, { PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import CommonSchemaPreview from '../../common/components/SchemaPreview';
import { columnsForOutputSchema } from '../selectors';
import _ from 'lodash';


function soqlToCoreType(soqlType) {
  return {
    'SoQLText': 'text',
    'SoQLNumber': 'number',
    'SoQLBoolean': 'checkbox', // arghghghghhhh
    'SoQLFixedTimestamp': 'date',
    'SoQLFloatingTimestamp': 'date',
    'SoQLLocation': 'location',
    'SoQLPoint': 'point',
    'SoQLMultiPoint': 'multipoint',
    'SoQLLine': 'line',
    'SoQLMultiLine': 'multiline',
    'SoQLPolygon': 'polygon',
    'SoQLMultiPolygon': 'multipolygon'
  }[soqlType];
}

function mapStateToProps({ db }) {
  // TODO: how do we know which is the correct input schema to show?
  // how do we know which is the correct output schema to show?

  // TODO: this is awfully slow because the DB is arrays not keyed by id
  const latestOutputSchema = (db.output_schemas || []).
    reduce((acc, os) => {
      if (!acc) return os;
      if (os.id > acc.id) return os;
      return acc;
    }, null);

  if (latestOutputSchema) {
    const columns = columnsForOutputSchema(db, latestOutputSchema.id).map((column) => {
      const transform = _.find(db.transforms, { id: column.transform_id });
      return {
        dataTypeName: transform && soqlToCoreType(transform.output_soql_type),
        description: column.description,
        fieldName: column.field_name,
        name: column.display_name
      };
    });

    return {
      columns
    };
  }

  return {
    columns: []
  };
}

function mapDispatchToProps() {
  return {
    onExpandColumn() {},
    onExpandSchemaTable() {}
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CommonSchemaPreview);
