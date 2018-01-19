import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { getRowCount } from 'datasetManagementUI/reduxStuff/actions/views';
import CommonRowDetails from '../../common/components/RowDetails';

class ViewRowDetailsContainer extends Component {
  componentDidMount() {
    const { dispatch, fourfour } = this.props;
    dispatch(getRowCount(fourfour));
  }

  render() {
    const { rowLabel, rowCount, columnCount } = this.props;
    return <CommonRowDetails rowLabel={rowLabel} rowCount={rowCount} columnCount={columnCount} />;
  }
}

const mapStateToProps = ({ entities }, { fourfour }) => {
  const view = entities.views[fourfour];
  const rowLabel = _.get(view, 'metadata.rowLabel', I18n.common.default_row_label);

  return {
    rowLabel,
    rowCount: view.rowCount,
    columnCount: view.columns.length
  };
};

ViewRowDetailsContainer.propTypes = {
  dispatch: PropTypes.func.isRequired,
  fourfour: PropTypes.string.isRequired,
  rowLabel: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
  columnCount: PropTypes.number.isRequired
};

export default connect(mapStateToProps)(ViewRowDetailsContainer);
