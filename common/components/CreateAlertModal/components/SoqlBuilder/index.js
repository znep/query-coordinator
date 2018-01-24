import _ from 'lodash';
import classNames from 'classnames';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';
import Spinner from 'common/components/Spinner';

import SoqlSliceBuilder from './SoqlSliceBuilder';
import datasetApi from 'common/components/CreateAlertModal/api/datasetApi';
import styles from './index.module.scss';

/**
  SoqlBuilder renders form fields(using SoqlSliceBuilder) for soql query. On a change,
  it will propagate back the soql slices back to the parent. Also renders add/delete buttons,
  for adding/removing soql slices.

  SoqlSlice: A soql slice can be a
    - group by or a
    - a condition
*/
class SoqlBuilder extends Component {
  state = {
    datasetColumns: [],
    haveNbeView: false,
    isDataLoading: false
  };

  componentWillMount() {
    const { viewId } = this.props;
    const groupByText = I18n.t('column.group_by', { scope: this.translationScope });
    const rowCountText = I18n.t('column.row_count', { scope: this.translationScope });

    // api to fetch columns
    const columnPromise = datasetApi.getColumns({ viewId });
    // api to check dataset is NBE or OBE
    // OBE wont support some query operators (eg: like)
    const migrationPromise = datasetApi.getMigration({ viewId });

    this.setState({ isDataLoading: true });
    Promise.all([columnPromise, migrationPromise]).then((results) => {
      const migrationData = results[1] || {};
      const datasetColumns = results[0] || [];

      // adding group_by, row count option in column list
      datasetColumns.push({ title: groupByText, value: 'group_by', column_type: 'groupBy' });
      datasetColumns.push({ title: rowCountText, value: 'COUNT(*)', column_type: 'row_identifier' });
      this.setState({
        datasetColumns,
        haveNbeView: !_.isEmpty(_.get(migrationData, 'nbeId')),
        isDataLoading: false
      });
    }).catch((error) => {
      this.setState({ datasetColumns: [], haveNbeView: false, isDataLoading: false });
    });
  }

  onSoqlSliceChange = (alert, index) => {
    const { onSoqlChange, soqlSlices } = this.props;

    soqlSlices[index] = alert;
    onSoqlChange(soqlSlices);
  };

  addSoqlSlice = () => {
    const { onSoqlChange, soqlSlices } = this.props;

    if (!_.isEmpty(soqlSlices)) {
      soqlSlices.push({ logical_operator: 'and' });
    } else {
      soqlSlices.push({});
    }
    onSoqlChange(soqlSlices);
  };

  translationScope = 'shared.components.create_alert_modal.custom_alert';

  removeSoqlSlice = (index) => {
    const { onSoqlChange, soqlSlices } = this.props;

    soqlSlices.splice(index, 1);
    onSoqlChange(soqlSlices);
  };

  renderBuilder() {
    const { datasetColumns, haveNbeView } = this.state;
    const { mapboxAccessToken, soqlSlices, viewId } = this.props;

    const slicesContent = soqlSlices.map((slice, index) =>
      <SoqlSliceBuilder
        slice={slice}
        sliceIndex={index}
        viewId={viewId}
        datasetColumns={datasetColumns}
        mapboxAccessToken={mapboxAccessToken}
        key={index}
        haveNbeView={haveNbeView}
        removeSliceEntry={this.removeSoqlSlice}
        onSliceValueChange={this.onSoqlSliceChange} />
    );

    return (
      <div styleName="soql-slices-section">
        <div>
          {slicesContent}
        </div>
        <button
          styleName="add-soql-slice-button"
          className="btn btn-primary add-parameter-button"
          onClick={this.addSoqlSlice}>
          + {I18n.t('add_params', { scope: 'shared.components.create_alert_modal.button' })}
        </button>
      </div>
    );
  }

  render() {
    const { isDataLoading } = this.state;

    return (
      <div styleName="soql-builder">
        {isDataLoading ? <Spinner /> : this.renderBuilder()}
      </div>
    );
  }
}

SoqlBuilder.defaultProps = {
  soqlSlices: []
};

SoqlBuilder.propTypes = {
  mapboxAccessToken: PropTypes.string,
  soqlSlices: PropTypes.array,
  viewId: PropTypes.string,
  onSoqlChange: PropTypes.func
};

export default cssModules(SoqlBuilder, styles, { allowMultiple: true });
