import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { localizeLink } from 'common/locale';
import { MetadataTable } from 'common/components';

// Pane containing generic asset metadata for the measure.
export class MetadataPane extends Component {
  render() {
    const { activePane, measure, coreView } = this.props;

    if (activePane !== 'metadata') {
      return null;
    }

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
  activePane: PropTypes.string,
  measure: PropTypes.object
};

function mapStateToProps(state) {
  return state.view;
}

export default connect(mapStateToProps)(MetadataPane);
