import React from 'react';

export default class TableHeaderColumn extends React.Component {
  constructor(props) {
    super(props);

    this.handleColumnClick = this.handleColumnClick.bind(this);
  }

  handleColumnClick() {
    this.props.onClick(this.props.column);
  }

  render() {
    const { column } = this.props;
    const { title } = column;

    return (
      <th onClick={this.handleColumnClick}>
        { title }
      </th>
    );
  }
}

TableHeaderColumn.propTypes = {
  sorting: React.PropTypes.shape({
    direction: React.PropTypes.oneOf(['asc', 'desc']).isRequired,
    column:  React.PropTypes.object.isRequired
  }),
  column: React.PropTypes.object.isRequired,
  onClick: React.PropTypes.func.isRequired
};