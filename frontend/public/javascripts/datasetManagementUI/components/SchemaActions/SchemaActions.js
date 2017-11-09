import React, { Component } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as Links from 'links/links';
import { Link, withRouter } from 'react-router';

const SchemaActions = ({ oss, iss, params }) => {
  const items = oss.map(os => (
    <li>
      {os.id} -{' '}
      <Link to={Links.showOutputSchema(params, iss[os.input_schema_id].source_id, os.input_schema_id, os.id)}>
        Restore
      </Link>
    </li>
  ));
  return <ul>{items}</ul>;
};

SchemaActions.propTypes = {
  oss: PropTypes.array.isRequired,
  iss: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

const mapStateToProps = ({ entities }, { params }) => ({
  oss: Object.values(entities.output_schemas).filter(os => os.id !== Number(params.outputSchemaId)),
  iss: entities.input_schemas
});

// See note in ShowOutputSchema.js
function wrapper(Wrapped) {
  return class extends Component {
    shouldComponentUpdate(nextProps) {
      return !_.isEqual(this.props, nextProps);
    }

    render() {
      return <Wrapped {...this.props} />;
    }
  };
}

export default withRouter(connect(mapStateToProps)(wrapper(SchemaActions)));
