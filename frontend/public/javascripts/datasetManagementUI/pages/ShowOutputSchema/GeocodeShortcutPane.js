import PropTypes from 'prop-types';
import React, { Component } from 'react';
import GeocodeShortcut from 'containers/GeocodeShortcutContainer';
import classNames from 'classnames';
import styles from './ShowOutputSchema.module.scss';
import { map } from 'lodash';
import * as FormActions from 'reduxStuff/actions/forms';

class GeocodeShortcutPane extends Component {
  componentWillMount() {
    const { columns, geocodeShortcutForm, dispatch } = this.props;
    const initialOutputColumns = map(columns, col => col.field_name);
    const newFormState = { ...geocodeShortcutForm, initialOutputColumns };
    dispatch(FormActions.setFormState('geocodeShortcutForm', newFormState));
  }
  render() {
    const { params, location, newOutputSchema } = this.props;
    return (
      <div className={classNames(styles.contentWrap, styles.optionsWrap)}>
        <GeocodeShortcut params={params} location={location} newOutputSchema={newOutputSchema} />
      </div>
    );
  }
}

GeocodeShortcutPane.propTypes = {
  params: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  geocodeShortcutForm: PropTypes.object,
  dispatch: PropTypes.func,
  newOutputSchema: PropTypes.func,
  columns: PropTypes.arrayOf(PropTypes.object)
};

export default GeocodeShortcutPane;
