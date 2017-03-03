import React, { PropTypes, Component } from 'react';
import TableCell from './TableCell';

const RENDER_ROWS = 50;

class TableBody extends Component {

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(
      {
        columns: nextProps.transforms.map(t => [t.id, t.fetched_rows, t.error_indices]),
        errorsTransformId: nextProps.errorsTransformId
      },
      {
        columns: this.props.transforms.map(t => [t.id, t.fetched_rows, t.error_indices]),
        errorsTransformId: this.props.errorsTransformId
      }
    );
  }

  getData() {
    const transformTables = this.props.transforms.map((transform) => (
      this.props.db[`transform_${transform.id}`]
    ));
    let rowIndices;
    if (_.isNumber(this.props.errorsTransformId)) {
      const errorsTransform = _.find(this.props.db.transforms, { id: this.props.errorsTransformId });
      rowIndices = errorsTransform.error_indices || _.range(RENDER_ROWS);
    } else {
      rowIndices = _.range(0, RENDER_ROWS);
    }
    return rowIndices.map((rowIdx) => ({
      rowIdx,
      transforms: this.props.transforms.map((transform, transformIdx) => {
        const cell = transformTables[transformIdx][rowIdx];
        return {
          id: transform.id,
          cell
        };
      })
    }));
  }

  render() {
    const data = this.getData();
    const rows = data.map((row) => (
      <tr key={row.rowIdx}>
        {row.transforms.map((transform) => (
          <TableCell
            key={transform.id}
            cell={transform.cell} />
        ))}
      </tr>
    ));
    return (
      <tbody tabIndex="0">
        {rows}
      </tbody>
    );
  }

}

TableBody.propTypes = {
  db: PropTypes.object.isRequired,
  transforms: PropTypes.arrayOf(PropTypes.object).isRequired,
  errorsTransformId: PropTypes.number
};

export default TableBody;
