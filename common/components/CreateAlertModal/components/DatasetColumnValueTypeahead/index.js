import _ from 'lodash';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import datasetApi from 'common/components/CreateAlertModal/api/datasetApi';
import I18n from 'common/i18n';

import InputDropDown from '../InputDropDown';
import styles from '../components.module.scss';

/**
  Given a dataset and a column, if the dataset is
    NBE:
    provides a typeahead search of values in the given column. On input change,
    we fire a soql query and find the mathcing values in the dataset-column using
    like operator
    OBE:
    retrieves the top X occurring values in the dataset-column on load and provides
    typeahead with just that.
  On filling a value which is not available in the options, it still takes them and passes
  the value back to the parent component as the selected value.
*/
class DatasetColumnValueTypeahead extends Component {
  state = {
    columnValues: [],
    isDataLoading: false
  }

  componentWillMount = () => {
    const { column, haveNbeView, viewId } = this.props;
    const params = { column, viewId };

    if (!haveNbeView) {
      this.setState({ isDataLoading: true });
      datasetApi.getTopValuesByColumn(params).
        then((columnValues) => {
          this.setState({ columnValues, isDataLoading: false });
        }).
        catch((error) => {
          console.error(error);
          this.setState({ isDataLoading: false });
        });
    }
  }

  onInputChange = (searchValue) => {
    // On input change notify the parent component that the user has
    // modified the change, so that it clears the old selected lat/lng,
    // also preserves the user selection.
    this.props.onSelect({ value: searchValue });

    // If view is nbe fetch matching values using like operator.
    if (this.props.haveNbeView) {
      this.updateDropdownResults(searchValue);
    }
  };

  translationScope = 'shared.components.create_alert_modal.custom_alert';

  // Fetching values in column matching the user entered text.
  updateDropdownResults = _.debounce((option) => {
    const { column, haveNbeView, viewId } = this.props;
    const params = { viewId, column };
    let promise;

    if (haveNbeView) {
      params.searchText = option.value;
      promise = datasetApi.getMatchingColumnValues(params);
    } else {
      promise = datasetApi.getTopValuesByColumn(params);
    }
    this.setState({ isDataLoading: true });
    promise.then((columnValues) => {
      this.setState({ columnValues, isDataLoading: false });
    }).catch((error) => {
      console.error(error);
      this.setState({ isDataLoading: false });
    });
  }, this.props.typeaheadWaitTime, { leading: false, trailing: true });

  render() {
    const { value, onSelect } = this.props;
    const { columnValues, isDataLoading } = this.state;
    const placeholder = I18n.t('placeholder.value', { scope: this.translationScope });

    return (
      <InputDropDown
        onInputChange={this.onInputChange}
        onSelect={onSelect}
        options={columnValues}
        isLoading={isDataLoading}
        placeholder={placeholder}
        value={value} />
    );
  }
}

DatasetColumnValueTypeahead.defaultProps = {
  typeaheadWaitTime: 400,
  value: ''
};

DatasetColumnValueTypeahead.propTypes = {
  column: PropTypes.string.isRequired,
  haveNbeView: PropTypes.bool.isRequired,
  typeaheadWaitTime: PropTypes.number,
  value: PropTypes.string,
  viewId: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired
};

export default cssModules(DatasetColumnValueTypeahead, styles, { allowMultiple: true });
