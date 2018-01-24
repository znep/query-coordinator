import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import I18n from 'common/i18n';
import { isUserRoled } from '../../common/user';
import { enterEditMode } from '../actions';
import { ModeStates } from '../lib/constants';
import ExportFlannel from 'common/components/ExportFlannel';
import SoqlHelpers from 'common/visualizations/dataProviders/SoqlHelpers';

export class InfoPaneButtons extends PureComponent {

  render() {
    const { mode, onClickEdit } = this.props;

    const renderEditButton = () => {
      if (mode === ModeStates.VIEW && isUserRoled()) {
        return (
          <button className="btn btn-simple btn-sm btn-edit" onClick={onClickEdit}>
            {I18n.t('visualization_canvas.edit_visualization')}
          </button>
        );
      } else {
        return null;
      }
    };

    const whereClause = SoqlHelpers.whereClauseFilteringOwnColumn(
      {
        format: {
          type: 'visualization_interchange_format',
          version: 2
        },
        series: [
          {
            dataSource: {
              datasetUid: this.props.parentView.id,
              dimension: {},
              domain: window.location.hostname,
              type: 'socrata.soql',
              filters: this.props.filters
            },
            type: 'table'
          }
        ]
      },
      0
    );

    const flannelProps = {
      exportFormats: this.props.view.exportFormats,
      exportFilteredData: this.props.exportFilteredData,
      view: this.props.parentView,
      onDownloadData: this.props.onDownloadData,
      whereClause: whereClause
    };

    return (
      <div className="btn-group">
        <ExportFlannel {...flannelProps} />
        {renderEditButton()}
      </div>
    );
  }

}

InfoPaneButtons.propTypes = {
  mode: PropTypes.string.isRequired,
  parentView: PropTypes.object.isRequired,
  onClickEdit: PropTypes.func
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ onClickEdit: enterEditMode }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(InfoPaneButtons);
