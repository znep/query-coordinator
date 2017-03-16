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
      const errorsTransform = this.props.db.transforms[this.props.errorsTransformId];
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

    const rowError = {
      'wanted': 22,
      'type': 'too_short',
      'index': 3523,
      'got': 5,
      'contents': ['9649055', 'HX299475', '06/11/2014 08:30:00 AM', '014XX W WALTON ST', '0'],
      'id': '288-3523',
      'input_schema_id': 288,
      '__status__': {'type': 'SAVED', 'savedAt': 'ON_SERVER'}
    };

    return (
      <tbody tabIndex="0">
        <tr key={'guuuuuuuuh'} className="malformed-row">
          <td>
            <span className="malformed-row-tag">!</span>
            <span className="malformed-row-location">Malformed row at row {rowError.index}</span>
            <span className="malformed-row-error">Expected {rowError.wanted} columns, found {rowError.got}</span>
            <span className="malformed-row-contents">Row content: {rowError.contents.map((cell) => `"${cell.replace('"', '\\"')}"`).join(',')}</span>
          </td>
        </tr>
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
