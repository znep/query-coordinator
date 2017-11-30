import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import LocalizedText from 'common/i18n/components/LocalizedText';
import { handleEnter } from 'common/dom_helpers/keyPressHelpers';
import * as actions from '../../actions';

class Head extends PureComponent {

  onColumnHeaderClick(column) {
    if (column !== 'actions') {
      this.props.changeOrder(column);
    }
  }

  renderSortableTh = (column) => {
    const { order } = this.props;
    const isColumnActive = column === _.get(order, 'column');
    const localeKey = `screens.admin.activity_feed.columns.${column}`;

    const thProps = {
      className: classNames(_.kebabCase(column), {
        active: isColumnActive,
        ascending: isColumnActive && _.get(order, 'direction') === 'asc',
        descending: isColumnActive && _.get(order, 'direction') === 'desc'
      }),
      key: column,
      onClick: () => this.onColumnHeaderClick(column),
      onKeyDown: handleEnter(() => this.onColumnHeaderClick(column)),
      scope: 'col',
      tabIndex: 0
    };

    return (
      <th {...thProps}>
        <LocalizedText className="column-name" localeKey={localeKey} />
        <span className="ascending-arrow socrata-icon-arrow-up2" />
        <span className="descending-arrow socrata-icon-arrow-down2" />
      </th>
    );
  }

  render() {
    const columns = ['asset_type', 'acting_user_name', 'activity_type',
      'dataset_name', 'created_at', 'actions'];

    return (
      <thead>
        <tr>
          {columns.map(this.renderSortableTh)}
        </tr>
      </thead>
    );
  }
}

Head.propTypes = {
  changeOrder: PropTypes.func.isRequired,
  order: PropTypes.object
};

Head.defaultProps = {
  order: undefined
};

const mapStateToProps = state => ({
  order: _.get(state, 'order', {})
});

const mapDispatchToProps = dispatch => ({
  changeOrder: (column) => dispatch(actions.order.changeOrder(column))
});

export default connect(mapStateToProps, mapDispatchToProps)(Head);
