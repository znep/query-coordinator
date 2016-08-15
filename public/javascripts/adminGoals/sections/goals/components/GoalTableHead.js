import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import * as Actions from '../actions';
import * as Selectors from '../selectors';
import * as State from '../state';
import classNames from 'classnames/bind';
import SocrataCheckbox from '../../../components/SocrataCheckbox/SocrataCheckbox';

class GoalTableHead extends React.Component {
  constructor(props) {
    super(props);

    this.handleColumnClick = this.handleColumnClick.bind(this);
    this.handleToggleAllSelection = this.handleToggleAllSelection.bind(this);
  }

  handleColumnClick(event) {
    const element = event.target;
    const fieldName = element.getAttribute('data-column');
    const direction = element.getAttribute('data-direction');

    this.props.actions.sortBy(fieldName, direction, 'string');
  }

  handleToggleAllSelection() {
    const { actions, paginatedGoalIds, isAllSelected } = this.props;

    if (isAllSelected) {
      actions.setSelection([]);
    } else {
      actions.setSelection(paginatedGoalIds);
    }
  }

  render() {
    let titlesList = ['title', 'owner', 'updated_at', 'visibility', 'goal_status', 'dashboard'];
    let titles = _.map(titlesList, (label, index) => {
      let direction = this.props.currentColumn == label && this.props.currentDirection == 'asc' ? 'desc' : 'asc';
      let thClass = classNames('order-icon', {
        'icon-arrow-up': this.props.currentColumn == label && direction == 'asc',
        'icon-arrow-down': this.props.currentColumn == label && direction == 'desc'
      });

      return (
        <th key={ index } className={ `table-heading-${label}` }>
          <span data-column={ label } data-direction={ direction } onClick={ this.handleColumnClick }>
          { this.props.translations.getIn(['admin', 'listing', label]) }
          </span>
          <span className={ thClass }/>
        </th>
      );
    });

    return (
      <thead>
      <tr>
        <th><SocrataCheckbox checked={ this.props.isAllSelected } onClick={ this.handleToggleAllSelection }/></th>
        <th>&nbsp;</th>
        { titles }
        <th>&nbsp;</th>
      </tr>
      </thead>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  isAllSelected: Selectors.getIsAllSelected(state),
  paginatedGoalIds: Selectors.getPaginatedGoalIds(state),
  currentColumn: State.getSorting(state).get('fieldName'),
  currentDirection: State.getSorting(state).get('direction')
});

const mapDispatchToProps = dispatch => ({
  actions: Redux.bindActionCreators(Actions.UI, dispatch)
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(GoalTableHead);
