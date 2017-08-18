import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { setActivePane } from '../actions';

export class PaneTabs extends Component {
  render() {
    const { activePane, onClickTab } = this.props;

    const tabs = {
      summary: 'Summary',
      metadata: 'Detailed Metadata'
    };

    const tabElements = _.map(tabs, (title, id) => {
      const classes = classNames(
        'tab-link',
        { current: id === activePane }
      );

      return (
        <li key={id} className={classes} data-pane={id}>
          <a href="#" onClick={onClickTab}>{title}</a>
        </li>
      );
    });

    return (
      <ul className="nav-tabs">
        {tabElements}
      </ul>
    );
  }
}

PaneTabs.propTypes = {
  activePane: PropTypes.string.isRequired,
  onClickTab: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'activePane');
}

function mapDispatchToProps(dispatch) {
  return {
    onClickTab(event) {
      event.preventDefault();

      const tabItem = event.target.parentElement;
      if (tabItem.classList.contains('current')) {
        return;
      }

      dispatch(setActivePane(tabItem.dataset.pane));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PaneTabs);