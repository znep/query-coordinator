import cx from 'classnames';
import omit from 'lodash/fp/omit';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';

import { customConnect } from 'common/connectUtils';

import * as Actions from '../../actions';
import styles from './hoverable.module.scss';

const mapStateToProps = state => ({
  hovered: state.get('hovered')
});

const mapDispatchToProps = (dispatch, { name }) =>
  bindActionCreators(
    {
      hoverRow: () => Actions.hoverRow(name),
      unhoverRow: () => Actions.unhoverRow(name)
    },
    dispatch
  );

class Hoverable extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    hoverRow: PropTypes.func.isRequired,
    unhoverRow: PropTypes.func.isRequired,
    hovered: PropTypes.string
  };

  render() {
    const { children, name, hoverRow, unhoverRow, hovered, ...props } = this.props;

    const className = cx({ hovered: name === hovered });

    const childrenWithExtraProp = React.Children.map(children, child =>
      React.cloneElement(child, omit('styles', props))
    );

    return (
      <div className={className} onMouseEnter={hoverRow} onMouseLeave={unhoverRow}>
        {childrenWithExtraProp}
      </div>
    );
  }
}

export default customConnect({ mapStateToProps, mapDispatchToProps, styles })(Hoverable);
