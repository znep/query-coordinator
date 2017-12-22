import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { localizeLink } from 'common/locale';
import { MetadataTable } from 'common/components';

// Pane containing generic asset metadata for the measure.
export class MetadataPane extends Component {
  render() {
    const { coreView } = this.props;

    return (
      <div className="pane" data-pane="metadata">
        <MetadataTable
          coreView={coreView}
          header={null}
          localizeLink={localizeLink}
          disableContactDatasetOwner />
      </div>
    );
  }
}

MetadataPane.propTypes = {
  measure: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return state.view;
}

export default connect(mapStateToProps)(MetadataPane);
