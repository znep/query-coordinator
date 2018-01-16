import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Dropdown, AccordionContainer, AccordionPane } from 'common/components';
import I18n from 'common/i18n';

import {
  BASE_LAYERS,
  BASE_MAP_STYLES,
  MAP_SLIDER_DEBOUNCE_MILLISECONDS
} from '../../constants';

import EmptyPane from './EmptyPane';
import DebouncedSlider from '../shared/DebouncedSlider';
import DebouncedInput from '../shared/DebouncedInput';

import * as selectors from '../../selectors/vifAuthoring';
import * as actions from '../../actions';

export class BasemapPane extends Component {
  scope = 'shared.visualizations.panes.basemap';

  renderEmptyPane = () => {
    return <EmptyPane />;
  }

  renderBasemapStyleSelector = () => {
    const {
      vifAuthoring,
      onSelectBaseMapStyle,
      onChangeBaseMapOpacity
    } = this.props;
    const defaultBaseMapStyle = selectors.getBaseMapStyle(vifAuthoring);
    const defaultBaseMapOpacity = selectors.getBaseMapOpacity(vifAuthoring);
    const baseMapStyleAttributes = {
      id: 'base-map-style',
      options: _.map(BASE_MAP_STYLES, mapLayer => ({
        title: mapLayer.title,
        value: mapLayer.value
      })),
      value: defaultBaseMapStyle,
      onSelection: onSelectBaseMapStyle
    };
    const disabled = _.findIndex(BASE_LAYERS, ['value', defaultBaseMapStyle]) === -1;
    const baseMapOpacityFieldClasses = classNames(
      'authoring-field base-map-opacity-container',
      { disabled }
    );
    const baseMapOpacityAttributes = {
      delay: MAP_SLIDER_DEBOUNCE_MILLISECONDS,
      disabled,
      id: 'base-map-opacity',
      rangeMax: 1,
      rangeMin: 0,
      step: 0.1,
      value: defaultBaseMapOpacity,
      onChange: onChangeBaseMapOpacity
    };

    return (
      <AccordionPane
        key="basemapStyles"
        title={I18n.t('subheaders.base_map', { scope: this.scope })}>
        <div className="authoring-field">
          <label className="block-label" htmlFor="base-map-style">
            {I18n.t('fields.base_map_style.title', { scope: this.scope })}
          </label>
          <div className="base-map-style-dropdown-container">
            <Dropdown {...baseMapStyleAttributes} />
          </div>
        </div>

        <div className={baseMapOpacityFieldClasses}>
          <label className="block-label" htmlFor="base-map-opacity">
            {I18n.t('fields.base_map_opacity.title', { scope: this.scope })}
          </label>
          <div id="base-map-opacity-container">
            <DebouncedSlider {...baseMapOpacityAttributes} />
          </div>
        </div>
      </AccordionPane>
    );
  }

  renderCheckboxControl = (name, checked, onChange) => {
    const id = `${name}_control`;
    const inputAttributes = {
      checked,
      id,
      type: 'checkbox',
      onChange
    };

    return (
      <div className="checkbox">
        <input {...inputAttributes} />
        <label className="inline-label" htmlFor={id}>
          <span className="fake-checkbox">
            <span className="icon-checkmark3"></span>
          </span>
          {I18n.t(`fields.${name}_control.title`, { scope: this.scope })}
        </label>
      </div>
    );
  }

  renderMapControls = () => {
    const {
      onChangeGeoCoderControl,
      onChangeGeoLocateControl,
      onChangeNavigationControl,
      vifAuthoring
    } = this.props;
    const isGeoCoderControlChecked = selectors.getGeoCoderControl(vifAuthoring);
    const isGeoLocateControlChecked = selectors.getGeoLocateControl(vifAuthoring);
    const isNavigationControlChecked = selectors.getNavigationControl(vifAuthoring);

    return (
      <AccordionPane
        title={I18n.t('subheaders.map_controls', { scope: this.scope })}
        key="basemapControls">
        {this.renderCheckboxControl('geo_coder', isGeoCoderControlChecked, onChangeGeoCoderControl)}
        {this.renderCheckboxControl('geo_locate', isGeoLocateControlChecked, onChangeGeoLocateControl)}
        {this.renderCheckboxControl('navigation', isNavigationControlChecked, onChangeNavigationControl)}
      </AccordionPane>
    );
  }

  renderBoundaryField = (id, onChange, value) => {
    const labelAttributes = {
      className: 'block-label',
      htmlFor: id
    };

    const inputAttributes = {
      className: 'text-input',
      id,
      type: 'number',
      value,
      onChange
    };

    return (
      <div className="authoring-field">
        <label {...labelAttributes}>
          {I18n.t(`fields.${id}.title`, { scope: this.scope })}
        </label>
        <DebouncedInput {...inputAttributes} />
      </div>
    );
  }

  renderSearchBoundaryFields = () => {
    const {
      onChangeSearchBoundaryUpperLeftLatitude,
      onChangeSearchBoundaryUpperLeftLongitude,
      onChangeSearchBoundaryLowerRightLatitude,
      onChangeSearchBoundaryLowerRightLongitude,
      vifAuthoring
    } = this.props;
    const searchBoundaryUpperLeftLatitude = selectors.getSearchBoundaryUpperLeftLatitude(vifAuthoring);
    const searchBoundaryUpperLeftLongitude = selectors.getSearchBoundaryUpperLeftLongitude(vifAuthoring);
    const searchBoundaryLowerRightLatitude = selectors.getSearchBoundaryLowerRightLatitude(vifAuthoring);
    const searchBoundaryLowerRightLongitude = selectors.getSearchBoundaryLowerRightLongitude(vifAuthoring);

    return (
      <AccordionPane
        title={I18n.t('subheaders.search_boundary', { scope: this.scope })}
        key="searchBoundaryFields">
        {this.renderBoundaryField(
          'upper_left_latitude',
          onChangeSearchBoundaryUpperLeftLatitude,
          searchBoundaryUpperLeftLatitude
        )}
        {this.renderBoundaryField(
          'upper_left_longitude',
          onChangeSearchBoundaryUpperLeftLongitude,
          searchBoundaryUpperLeftLongitude
        )}
        {this.renderBoundaryField(
          'lower_right_latitude',
          onChangeSearchBoundaryLowerRightLatitude,
          searchBoundaryLowerRightLatitude
        )}
        {this.renderBoundaryField(
          'lower_right_longitude',
          onChangeSearchBoundaryLowerRightLongitude,
          searchBoundaryLowerRightLongitude
        )}
      </AccordionPane>
    );
  }

  renderBasemapControls = () => {
    return [this.renderBasemapStyleSelector(), this.renderMapControls(), this.renderSearchBoundaryFields()];
  }

  render() {
    let configuration = null;
    const { vifAuthoring } = this.props;

    if (selectors.isNewGLMap(vifAuthoring)) {
      configuration = this.renderBasemapControls();
    } else {
      configuration = this.renderEmptyPane();
    }

    return (
      <form>
        <AccordionContainer>
          {configuration}
        </AccordionContainer>
      </form>
    );
  }
}

BasemapPane.defaultProps = {};

function mapStateToProps(state) {
  return {
    vifAuthoring: state.vifAuthoring,
    metadata: state.metadata
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectBaseMapStyle: (baseMapStyle) => {
      dispatch(actions.setBaseMapStyle(baseMapStyle.value));
    },

    onChangeBaseMapOpacity: (baseMapOpacity) => {
      dispatch(actions.setBaseMapOpacity(_.round(baseMapOpacity, 2)));
    },

    onChangeGeoCoderControl: (event) => {
      const geoCoderControl = event.target.checked;
      dispatch(actions.setGeoCoderControl(geoCoderControl));
    },

    onChangeGeoLocateControl: (event) => {
      const geoLocateControl = event.target.checked;
      dispatch(actions.setGeoLocateControl(geoLocateControl));
    },

    onChangeNavigationControl: (event) => {
      const navigationControl = event.target.checked;
      dispatch(actions.setNavigationControl(navigationControl));
    },

    onChangeSearchBoundaryUpperLeftLatitude: (event) => {
      const upperLeftLatitude = event.target.value;
      dispatch(actions.setSearchBoundaryUpperLeftLatitude(upperLeftLatitude));
    },

    onChangeSearchBoundaryUpperLeftLongitude: (event) => {
      const upperLeftLongitude = event.target.value;
      dispatch(actions.setSearchBoundaryUpperLeftLongitude(upperLeftLongitude));
    },

    onChangeSearchBoundaryLowerRightLatitude: (event) => {
      const lowerRightLatitude = event.target.value;
      dispatch(actions.setSearchBoundaryLowerRightLatitude(lowerRightLatitude));
    },

    onChangeSearchBoundaryLowerRightLongitude: (event) => {
      const lowerRightLongitude = event.target.value;
      dispatch(actions.setSearchBoundaryLowerRightLongitude(lowerRightLongitude));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(BasemapPane);
