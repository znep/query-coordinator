import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { setDataSource } from '../../actions/editor';

export const DataSourceStates = Object.freeze({
  VALID: 'VALID',
  INVALID: 'INVALID',
  NO_ROWS: 'NO_ROWS'
});

// Configuration panel for connecting a measure to a data source.
export class DataPanel extends Component {
  render() {
    const { dataSourceState, uid, onChangeDataSource } = this.props;

    const iconClasses = classNames('data-source-indicator', {
      'icon-check-2': dataSourceState === DataSourceStates.VALID,
      'icon-warning': dataSourceState === DataSourceStates.NO_ROWS,
      'icon-cross2': dataSourceState === DataSourceStates.INVALID
    });

    let noticeMessage;
    if (dataSourceState === DataSourceStates.NO_ROWS) {
      noticeMessage = (
        <p>
          The specified dataset has no data; you will be unable to compute a metric.
        </p>
      );
    } else if (dataSourceState === DataSourceStates.INVALID) {
      noticeMessage = (
        <p>
          The specified dataset could not be found.
        </p>
      );
    }

    return (
      <form onSubmit={(event) => event.preventDefault()}>
        <div className="configuration-field">
          <label className="block-label" htmlFor="data-source">Data Source (NBE)</label>
          <input
            type="text"
            id="data-source"
            className="text-input"
            defaultValue={uid}
            onChange={onChangeDataSource} />
          <span className={iconClasses} />
          {noticeMessage}
        </div>
      </form>
    );
  }
}

DataPanel.propTypes = {
  uid: PropTypes.string,
  dataSourceState: PropTypes.oneOf(_.values(DataSourceStates)).isRequired,
  onChangeDataSource: PropTypes.func
};

export function mapStateToProps(state) {
  const uid = _.get(state, 'editor.measure.metric.dataSource.uid');
  const rowCount = _.get(state, 'editor.cachedRowCount');

  let dataSourceState = DataSourceStates.INVALID;

  if (rowCount > 0) {
    dataSourceState = DataSourceStates.VALID;
  } else if (rowCount === 0) {
    dataSourceState = DataSourceStates.NO_ROWS;
  }

  return {
    dataSourceState,
    uid
  };
}

function mapDispatchToProps(dispatch) {
  const bindEventValue = (func) => (event) => func(event.currentTarget.value);

  return bindActionCreators({
    // TODO: debounce this properly
    onChangeDataSource: bindEventValue(setDataSource)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DataPanel);
