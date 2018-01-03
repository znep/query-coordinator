/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';
import _ from 'lodash';
import React, { Component } from 'react';
import classNames from 'classnames';
import FlashMessage from 'containers/FlashMessageContainer';
import ColumnPreview from './ColumnPreview';
import HideOriginal from './HideOriginal';
import ErrorHandling from './ErrorHandling';
import styles from './GeocodeShortcut.module.scss';
import flashMessageStyles from 'components/FlashMessage/FlashMessage.module.scss';

import {
  LatLngFields
} from './LatLngFields';

import {
  CombinedFields
} from './CombinedFields';

import {
  ComponentFields
} from './ComponentFields';

const SubI18n = I18n.show_output_schema.geocode_shortcut;

// Different types of composition strategies
const COMPONENTS = 'COMPONENTS';
const COMBINED = 'COMBINED';
const LATLNG = 'LATLNG';

const fieldSet = (composedFrom, mappings, setMapping, outputColumns) =>
  ({
    LATLNG: <LatLngFields outputColumns={outputColumns} setMapping={setMapping} mappings={mappings} />,
    COMPONENTS: <ComponentFields outputColumns={outputColumns} setMapping={setMapping} mappings={mappings} />,
    COMBINED: <CombinedFields outputColumns={outputColumns} setMapping={setMapping} mappings={mappings} />
  }[composedFrom]);

class GeocodeShortcut extends Component {
  createNewOutputSchema(desiredColumns) {
    return this.props
      .newOutputSchema(desiredColumns)
      .catch(resp => {
        const { body } = resp;
        if (body && body.params) {
          const message = _.flatMap(_.values(body.params), errors => errors);
          this.props.showError(message);
        } else {
          console.error(resp);
        }
        return resp;
      });
  }

  render() {
    const {
      params,
      entities,
      redirectGeocodePane,
      displayState,
      inputSchema,
      outputSchema,
      outputColumn,
      anySelected,
      isPreviewable
    } = this.props;

    const {
      mappings,
      shouldHideOriginal,
      shouldConvertToNull,
      composedFrom,
      desiredColumns,
      configurationError
    } = this.props.formState;


    const onPreview = () => this.createNewOutputSchema(desiredColumns).then(resp => {
      redirectGeocodePane(resp.resource.id);
    });

    const isLatLng = composedFrom === LATLNG;
    const isCombined = composedFrom === COMBINED;
    const isComponents = composedFrom === COMPONENTS;

    const composeLatlng = () => this.props.setComposedFrom(LATLNG);
    const latlngClassname = classNames({
      [styles.compositionSelected]: isLatLng,
      [styles.compositionButton]: !isLatLng
    });
    const composeComponents = () => this.props.setComposedFrom(COMPONENTS);
    const componentsClassname = classNames({
      [styles.compositionSelected]: isComponents,
      [styles.compositionButton]: !isComponents
    });
    const composeCombined = () => this.props.setComposedFrom(COMBINED);
    const combinedClassname = classNames({
      [styles.compositionSelected]: isCombined,
      [styles.compositionButton]: !isCombined
    });


    const content = !configurationError ? (
      <div className={styles.content}>
        <div className={styles.formWrap}>
          <form>
            {fieldSet(
              this.props.formState.composedFrom,
              mappings,
              this.props.setMapping,
              this.props.allOutputColumns
            )}

            <HideOriginal
              shouldHideOriginal={shouldHideOriginal}
              toggleHideOriginal={this.props.toggleHideOriginal} />

            <ErrorHandling
              shouldConvertToNull={shouldConvertToNull}
              toggleConvertToNull={this.props.toggleConvertToNull} />
          </form>
        </div>
        <ColumnPreview
          entities={entities}
          anySelected={anySelected}
          outputColumn={outputColumn}
          inputSchema={inputSchema}
          outputSchema={outputSchema}
          displayState={displayState}
          isPreviewable={isPreviewable}
          onPreview={onPreview}
          params={params} />
      </div>
    ) : (
      <div className={classNames(flashMessageStyles.error, styles.configurationError)}>
        {configurationError}
      </div>
    );

    return (
      <div className={styles.geocodeWrapper}>
        <h2>{SubI18n.title}</h2>
        <div className={styles.geocodeOptions}>
          <p>{SubI18n.what_is_geocoding}</p>
          <div className={styles.compositionSelector}>
            <button onClick={composeLatlng} className={latlngClassname}>
              {SubI18n.lat_long}
            </button>
            <button onClick={composeComponents} className={componentsClassname}>
              {SubI18n.addr_separate}
            </button>
            <button onClick={composeCombined} className={combinedClassname}>
              {SubI18n.addr_combined}
            </button>
          </div>
        </div>
        <FlashMessage />
        {content}
      </div>
    );
  }
}

GeocodeShortcut.propTypes = {
  view: PropTypes.object.isRequired,
  onDismiss: PropTypes.func,
  entities: PropTypes.object.isRequired,
  displayState: PropTypes.object.isRequired,
  newOutputSchema: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  redirectGeocodePane: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  formState: PropTypes.object.isRequired,

  setMapping: PropTypes.func.isRequired,
  toggleHideOriginal: PropTypes.func.isRequired,
  toggleConvertToNull: PropTypes.func.isRequired,
  setComposedFrom: PropTypes.func.isRequired,

  inputSchema: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  outputColumns: PropTypes.array.isRequired,
  outputColumn: PropTypes.object,
  allOutputColumns: PropTypes.array.isRequired,

  anySelected: PropTypes.bool.isRequired,
  isPreviewable: PropTypes.bool.isRequired
};

export { GeocodeShortcut, COMBINED, COMPONENTS, LATLNG };
