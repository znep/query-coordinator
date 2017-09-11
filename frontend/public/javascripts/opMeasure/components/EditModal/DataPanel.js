import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { DataSourceStates } from '../../lib/constants';
import { setDataSource } from '../../actions/editor';

// Configuration panel for connecting a measure to a data source.
export class DataPanel extends Component {
  componentDidMount() {
    // Initialize dataSource.status, which is not a persistent field.
    setDataSource(this.props.uid);
  }

  render() {
    const { uid, status, onChangeDataSource } = this.props;

    const iconClasses = classNames('data-source-indicator', {
      'icon-check-2': status === DataSourceStates.VALID,
      'icon-warning': status === DataSourceStates.NO_ROWS,
      'icon-cross2': status === DataSourceStates.INVALID
    });

    let noticeMessage;
    if (status === DataSourceStates.NO_ROWS) {
      noticeMessage = (
        <p>
          The specified dataset has no data; you will be unable to compute a metric.
        </p>
      );
    } else if (status === DataSourceStates.INVALID) {
      noticeMessage = (
        <p>
          The specified dataset could not be found.
        </p>
      );
    }

    return (
      <form>
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
  status: PropTypes.string,
  uid: PropTypes.string,
  onChangeDataSource: PropTypes.func
};

function mapStateToProps(state) {
  return state.editor.measure.metric.dataSource;
}

function mapDispatchToProps(dispatch) {
  const bindEventValue = (func) => (event) => func(event.currentTarget.value);

  return bindActionCreators({
    // TODO: debounce this properly
    onChangeDataSource: bindEventValue(setDataSource)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DataPanel);
