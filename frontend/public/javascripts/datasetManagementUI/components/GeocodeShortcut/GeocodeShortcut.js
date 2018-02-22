/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';
import _ from 'lodash';
import React, { Component } from 'react';
import classNames from 'classnames';
import FlashMessage from 'datasetManagementUI/containers/FlashMessageContainer';
import ColumnPreview from './ColumnPreview';
import HideOriginal from './HideOriginal';
import ErrorHandling from './ErrorHandling';
import styles from './GeocodeShortcut.module.scss';
import flashMessageStyles from 'datasetManagementUI/components/FlashMessage/FlashMessage.module.scss';

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

class GeocodeShortcut extends Component {
  constructor(props) {
    super(props);
    this.state = { initialOutputSchemaId: props.revision.output_schema_id };
    this.handleSave = this.handleSave.bind(this);
  }
  componentWillUnmount() {
    const { revision, revertRevisionOutputSchema } = this.props;
    const currentOutputSchemaId = revision.output_schema_id;
    const initialOutputSchemaId = this.state.initialOutputSchemaId;

    if (initialOutputSchemaId !== currentOutputSchemaId) {
      // revert the revision output schema to what it was before
      revertRevisionOutputSchema(initialOutputSchemaId, currentOutputSchemaId);
    }
  }
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
  handleSave(evt) {
    evt.preventDefault();
    const { desiredColumns } = this.props.formState;
    this.createNewOutputSchema(desiredColumns).then(resp => {
      // reset the initialOutputSchemaId so the state isn't reverted in componentWillUnmount
      this.setState({ initialOutputSchemaId: resp.resource.id });
      this.props.redirectToOutputSchema(resp.resource.id);
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

    let fieldSet;
    switch (this.props.formState.composedFrom) {
      case LATLNG:
        fieldSet = (<LatLngFields
          outputColumns={this.props.allOutputColumns}
          setMapping={this.props.setMapping}
          mappings={mappings} />);
        break;
      case COMPONENTS:
        fieldSet = (<ComponentFields
          outputColumns={this.props.allOutputColumns}
          setMapping={this.props.setMapping}
          mappings={mappings} />);
        break;
      case COMBINED:
        fieldSet = (<CombinedFields
          outputColumns={this.props.allOutputColumns}
          setMapping={this.props.setMapping}
          mappings={mappings} />);
        break;
      default:
        fieldSet = null;
    }

    const content = !configurationError ? (
      <div className={styles.content}>
        <div className={styles.formWrap}>
          <form>
            <button
              id="save-geocode-form"
              onClick={this.handleSave}
              style={{ display: 'none' }}>&nbsp;</button>

            {fieldSet}

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
  redirectToOutputSchema: PropTypes.func.isRequired,
  revertRevisionOutputSchema: PropTypes.func.isRequired,
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
  revision: PropTypes.object.isRequired,

  anySelected: PropTypes.bool.isRequired,
  isPreviewable: PropTypes.bool.isRequired
};

export { GeocodeShortcut, COMBINED, COMPONENTS, LATLNG };
