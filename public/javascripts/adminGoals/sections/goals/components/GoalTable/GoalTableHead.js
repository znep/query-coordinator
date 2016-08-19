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
      'handleColumnClick',
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

  handleColumnClick(event) {
    const element = event.target;
    const fieldName = element.getAttribute('data-column');
    const direction = element.getAttribute('data-direction');

    this.props.actions.sortBy(fieldName, direction, this.columnDataTypes[fieldName]);
  }

  handleToggleAllSelection() {
    const { actions, paginatedGoalIds, isAllSelected } = this.props;

    if (isAllSelected) {
      actions.setSelection([]);
    } else {
      actions.setSelection(paginatedGoalIds);
    }
  }

  renderColumn(label, index) {
    const { sortedColumn, sortedDirection } = this.props;

    const direction = sortedColumn == label && sortedDirection == 'asc' ? 'desc' : 'asc';
    const sortIconClass = classNames('order-icon', {
      'persist-visible': sortedColumn == label,
      'icon-arrow-down': sortedColumn == label && direction == 'asc',
      'icon-arrow-up': sortedColumn == label && direction == 'desc' || sortedColumn != label
    });

    return (
      <th key={ index } className={ `table-heading-${label}` }>
        <span className="th-text" data-column={ label } data-direction={ direction } onClick={ this.handleColumnClick }>
        { this.props.translations.getIn(['admin', 'listing', label]) }
        </span>
        <span className={ sortIconClass }/>
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
