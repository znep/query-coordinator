import PropTypes from 'prop-types';
import * as React from 'react';
import TransformStatus from '../TransformStatus/TransformStatus';
import TableBody from '../../containers/TableBodyContainer';
import * as columnHeaderStyles from '../../components/ColumnHeader/ColumnHeader.scss';
import * as styles from './SoQLResults.scss';

class SoQLResults extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displayState: props.displayState
    };
  }

  componentWillReceiveProps(props) {
    this.setState({
      displayState: props.displayState
    });
  }

  render() {
    return (
      <div className={styles.columnPreview}>
        <table>
          <thead>
            <tr>
              <th>
                <span
                  className={columnHeaderStyles.colName}
                  title={this.props.outputColumn.display_name}>
                  {this.props.outputColumn.display_name}
                </span>
              </th>
              <TransformStatus
                outputSchema={this.props.outputSchema}
                key={this.props.outputColumn.id}
                params={this.props.params}
                transform={this.props.transform}
                isIgnored={false}
                displayState={this.state.displayState}
                columnId={this.props.outputColumn.id}
                showShortcut={() => {}}
                shortcuts={[]}
                flyouts={false}
                onClickError={this.props.onClickError}
                totalRows={this.props.inputSchema.total_rows} />
            </tr>
          </thead>
          <TableBody
            entities={this.props.entities}
            columns={[this.props.outputColumn]}
            displayState={this.state.displayState}
            inputSchemaId={this.props.inputSchema.id}
            outputColumn={this.props.outputColumn} />
        </table>
      </div>
    );
  }
}

SoQLResults.propTypes = {
  outputSchema: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  displayState: PropTypes.object.isRequired,
  outputColumn: PropTypes.object.isRequired,
  onClickError: PropTypes.func.isRequired,
  inputSchema: PropTypes.object.isRequired,
  transform: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired
};

export default SoQLResults;
