import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames/bind';
import { toggleAllRows, sortRows } from '../actions/goalTableActions';

class GoalTableHead extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let titlesList = ['title', 'owner', 'updated_at', 'visibility', 'goal_status', 'dashboard'];
    let titles = _.map(titlesList, (label) => {

      let direction = this.props.currentColumn == label && this.props.currentDirection == 'asc' ? 'desc' : 'asc';
      let thClass = classNames('order-icon', {
        'icon-arrow-up': this.props.currentColumn == label && direction == 'asc',
        'icon-arrow-down': this.props.currentColumn == label && direction == 'desc'
      });

      return <th key={ _.uniqueId() }>
        <span data-column={ label } data-direction={ direction } onClick={ this.props.sort }>
          { this.props.translations.getIn(['admin', 'listing', label]) }
          <span className={ thClass } />
        </span>
      </th>;
    });

    return <thead>
      <tr>
        <th><input type="checkbox" onClick={ this.props.toggleAllRows } /></th>
        { titles }
        <th>&nbsp;</th>
      </tr>
    </thead>;
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  currentColumn: state.getIn(['goalTableData', 'tableOrder', 'column']),
  currentDirection: state.getIn(['goalTableData', 'tableOrder', 'direction'])
});

const mapDispatchToProps = dispatch => ({
  toggleAllRows: () => dispatch(toggleAllRows()),
  sort: event => dispatch(sortRows(event.target.getAttribute('data-column'), event.target.getAttribute('data-direction')))
});

export default connect(mapStateToProps, mapDispatchToProps)(GoalTableHead);
