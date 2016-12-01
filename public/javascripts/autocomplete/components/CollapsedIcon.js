import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';
import { collapseChanged } from '../actions';
import styles from './autocomplete.scss';
import searchIcon from 'icons/search.svg';

function CollapsedIcon({ onCollapsedChanged }) {
  return (
    <div
      styleName="collapsed-icon"
      dangerouslySetInnerHTML={{ __html: searchIcon }}
      onClick={() => { onCollapsedChanged(false); }} />
  );
}

CollapsedIcon.propTypes = {
  onCollapsedChanged: PropTypes.func.isRequired
};

const mapDispatchToProps = (dispatch) => ({
  onCollapsedChanged: (visible) => { dispatch(collapseChanged(visible)); }
});

export default connect(null, mapDispatchToProps)(cssModules(CollapsedIcon, styles));
