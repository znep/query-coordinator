import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as Selectors from 'selectors';

class NewForm extends Component {
  constructor() {
    super();
    this.state = {
      datasetForm: {},
      columnForm: {}
    };
  }

  componentWillMount() {
    this.setState({
      datasetForm: this.props.datasetMetadata,
      columnForm: this.props.outputSchemaColumns
    });
  }

  render() {
    return (
      <div>
        <pre style={{ whiteSpace: 'pre-wrap', width: 500 }}>{JSON.stringify(this.state)}</pre>;
        {this.props.children}
      </div>
    );
  }
}

// isNumber :: Any -> Boolean
// verifies its input is a number, exluding NaN; _.isNumber(NaN) returns true, which
// we don't want here
function isNumber(x) {
  return typeof x === 'number' && !isNaN(x);
}

// getOutputSchemaCols :: Entities -> Number -> Array OutputColumn | undefined
export function getOutputSchemaCols(entities, outputSchemaId) {
  let cols;

  if (isNumber(outputSchemaId)) {
    cols = Selectors.columnsForOutputSchema(entities, outputSchemaId);
  }

  return cols;
}

//  getRevision :: Revisions -> Number -> Revision | undefined
// Attempts to find a revision by its revision sequence number; if it fails to
// find a revision, it returns undefined
export function getRevision(revisions = {}, revisionSeq) {
  let rev;

  if (isNumber(revisionSeq)) {
    rev = Object.values(revisions).find(r => r.revision_seq === revisionSeq);
  }

  return rev;
}

const mapStateToProps = ({ entities }, { params }) => {
  const revisionSeq = Number(params.revisionSeq);
  const outputSchemaId = Number(params.outputSchemaId);
  const revision = getRevision(entities.revisions, revisionSeq);
  const datasetMetadata = revision && revision.metadata ? Selectors.datasetMetadata(revision.metadata) : {};
  const outputSchemaColumns = getOutputSchemaCols(entities, outputSchemaId) || {};

  return {
    datasetMetadata,
    outputSchemaColumns
  };
};

export default connect(mapStateToProps)(NewForm);
