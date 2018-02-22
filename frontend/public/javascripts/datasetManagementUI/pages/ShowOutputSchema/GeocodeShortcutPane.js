import PropTypes from 'prop-types';
import React, { Component } from 'react';
import GeocodeShortcut from 'datasetManagementUI/containers/GeocodeShortcutContainer';
import classNames from 'classnames';
import styles from './ShowOutputSchema.module.scss';
import { map } from 'lodash';
import * as FormActions from 'datasetManagementUI/reduxStuff/actions/forms';

class GeocodeShortcutPane extends Component {
  componentWillMount() {
    const { columns, geocodeShortcutForm, dispatch } = this.props;
    const initialOutputColumns = map(columns, col => col.field_name);
    const newFormState = { ...geocodeShortcutForm, initialOutputColumns };
    dispatch(FormActions.setFormState('geocodeShortcutForm', newFormState));
  }
  render() {
    const {
      params, location, newOutputSchema, revision, redirectToOutputSchema, revertRevisionOutputSchema
    } = this.props;
    return (
      <div className={classNames(styles.contentWrap, styles.optionsWrap)}>
        <GeocodeShortcut
          params={params}
          revision={revision}
          location={location}
          newOutputSchema={newOutputSchema}
          redirectToOutputSchema={redirectToOutputSchema}
          revertRevisionOutputSchema={revertRevisionOutputSchema} />
      </div>
    );
  }
}

GeocodeShortcutPane.propTypes = {
  params: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  geocodeShortcutForm: PropTypes.object,
  redirectToOutputSchema: PropTypes.func,
  revertRevisionOutputSchema: PropTypes.func,
  dispatch: PropTypes.func,
  newOutputSchema: PropTypes.func,
  columns: PropTypes.arrayOf(PropTypes.object),
  revision: PropTypes.object
};

export default GeocodeShortcutPane;
