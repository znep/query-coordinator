import _ from 'lodash';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import datasetApi from 'common/components/CreateAlertModal/api/datasetApi';
import I18n from 'common/i18n';

import InputDropDown from '../InputDropDown';
import styles from '../components.module.scss';

/**
  Typeahead geocoder text box + picklist.
  When user types in the search term, it geocodes using the mapbox geocoder api
  and shows the results for the user.
*/
class GeocoderTypeahead extends Component {
  state = {
    geoResults: [],
    isDataLoading: false
  }

  // On input change notify the parent component that the user has
  // modified the change, so that it clears the old selected lat/lng.
  onInputChange = (searchValue) => {
    this.props.onSelect({ value: searchValue });
    this.getGeoSearchResults(searchValue);
  };

  getGeoSearchResults = (searchValue) => {
    if (_.isEmpty(searchValue)) {
      this.setState({ geoResults: [] });
      return;
    }
    this.updateGeoResults(searchValue);
  }

  updateGeoResults = _.debounce((searchValue) => {
    const { mapboxAccessToken } = this.props;
    this.setState({ isDataLoading: true });
    datasetApi.geoSearch(searchValue, mapboxAccessToken).then((response) => {
      // response => Array of { title: <string>, value: <string>, lat: <number>, lng: <number> }
      this.setState({ geoResults: response, isDataLoading: false });
    }).catch(() => {
      this.setState({ isDataLoading: false });
    });
  }, this.props.typeaheadWaitTime, { leading: false, trailing: true });

  translationsScope = 'shared.components.create_alert_modal.custom_alert';

  render() {
    const { geoResults, isDataLoading } = this.state;
    const { onSelect, value } = this.props;
    const placeHolder = I18n.t('placeholder.location', { scope: this.translationsScope });

    return (
      <div styleName="field-selector">
        <InputDropDown
          isLoading={isDataLoading}
          listId="location-list"
          onInputChange={this.onInputChange}
          options={geoResults}
          onSelect={onSelect}
          placeholder={placeHolder}
          value={value} />
      </div>
    );
  }
}

GeocoderTypeahead.defaultProps = {
  typeaheadWaitTime: 400,
  value: ''
};

GeocoderTypeahead.propTypes = {
  mapboxAccessToken: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  // Callback, called on selection of a geocode result
  // Argument(If user selected a search result):
  //     Object:{
  //       title: 'United States',
  //       value: 'united states',
  //       geometry: {
  //         coordinates: [<lng>, <lat>]
  //      }
  // Argument(If has entered a search term but not selected any input):
  //     Object:{
  //       title: 'United Sta'
  //      }
  typeaheadWaitTime: PropTypes.number,
  value: PropTypes.string
};

export default cssModules(GeocoderTypeahead, styles, { allowMultiple: true });
