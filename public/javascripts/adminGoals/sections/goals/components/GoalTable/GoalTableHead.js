import _ from 'lodash';
import classNames from 'classnames/bind';

import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import * as Actions from '../../actions';
import * as Selectors from '../../selectors';
import * as State from '../../state';
import * as Components from '../../../../components';


class GoalTableHead extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleToggleAllSelection',
      'renderColumn'
    ]);

    this.columnDataTypes = {
      title: 'string',
      owner: 'string',
      updated_at: 'date',
      visibility: 'bool',
      goal_status: 'string',
      dashboard: 'string'
    };
  }

  handleToggleAllSelection() {
    const { actions, paginatedGoalIds, isAllSelected } = this.props;

    if (isAllSelected) {
      actions.setSelection([]);
    } else {
      actions.setSelection(paginatedGoalIds);
    }
  }

  renderColumn(fieldName, index) {
    const { sortedColumn, sortedDirection } = this.props;

    const direction = sortedColumn == fieldName && sortedDirection == 'asc' ? 'desc' : 'asc';
    const sortIconClass = classNames('order-icon', {
      'persist-visible': sortedColumn == fieldName,
      'icon-arrow-down': sortedColumn == fieldName && direction == 'asc',
      'icon-arrow-up': sortedColumn == fieldName && direction == 'desc' || sortedColumn != fieldName
    });
    const fieldType = this.columnDataTypes[fieldName];

    return (
      <th key={ index } className={ `table-heading-${fieldName}` }>
        <span className="th-text" onClick={ _.wrap({ fieldName, direction, fieldType }, this.props.actions.sortBy) }>
          { this.props.translations.getIn(['admin', 'listing', fieldName]) }
          <span className={ sortIconClass } />
        </span>
      </th>
    );
  }

  render() {
    const { isAllSelected } = this.props;
    let titles = _.map(Object.keys(this.columnDataTypes), this.renderColumn);

    return (
      <thead>
      <tr>
        <th><Components.Socrata.Checkbox checked={ isAllSelected } onClick={ this.handleToggleAllSelection }/></th>
        <th>&nbsp;</th>
        { titles }
      </tr>
      </thead>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  isAllSelected: Selectors.getIsAllSelected(state),
  paginatedGoalIds: Selectors.getPaginatedGoalIds(state),
  sortedColumn: State.getSorting(state).get('fieldName'),
  sortedDirection: State.getSorting(state).get('direction')
});

const mapDispatchToProps = dispatch => ({
  actions: Redux.bindActionCreators(Actions.UI, dispatch)
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(GoalTableHead);
