import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'socrata-components';
import { connect } from 'react-redux';
import { collapseChanged } from '../actions';
import styles from './autocomplete.scss';

function CollapsedIcon({ onCollapsedChanged }) {
  return (
    <div
      styleName="collapsed-icon"
      onClick={() => { onCollapsedChanged(false); }}>
      <SocrataIcon name="search" />
    </div>
  );
}

CollapsedIcon.propTypes = {
  onCollapsedChanged: PropTypes.func.isRequired
};

const mapDispatchToProps = (dispatch) => ({
  onCollapsedChanged: (visible) => { dispatch(collapseChanged(visible)); }
});

export default connect(null, mapDispatchToProps)(cssModules(CollapsedIcon, styles));
