import * as React from 'react';
import PropTypes from 'prop-types';
import SocrataIcon from '../../../common/components/SocrataIcon';
import * as styles from './TransformColumn.module.scss';
import {
  COMPILATION_FAILED
} from '../../reduxStuff/reducers/compiler';
import { SoQLEditor } from './SoQLEditor';
import FunctionDoc from './FunctionDoc';
import ColumnDoc from './ColumnDoc';
import SoQLResults from '../../containers/SoQLResultsContainer';
import { cloneOutputColumn, buildNewOutputColumn } from '../../reduxStuff/actions/showOutputSchema';

const SubI18n = I18n.transform_column;

const renderFunctionDoc = (completion) => (
  <FunctionDoc completion={completion} />
);

const renderColumnDoc = (completion) => (
  <ColumnDoc completion={completion} />
);


class TransformColumn extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.evaluateExpr = this.evaluateExpr.bind(this);
  }

  componentWillMount() {
    if (!this.props.compiler) {
      this.props.addCompiler(this.props.inputSchema);
    }
  }

  componentWillReceiveProps(props) {
    if (!props.compiler || props.compiler.inputSchema.id !== this.props.inputSchema.id) {
      props.addCompiler(props.inputSchema);
    }
  }


  genExpressionCompleter() {
    return (prefix, exact) => {
      const possibleColumns = this.props.inputColumns
      .filter((ic) => (exact ? ic.field_name === prefix : ic.field_name.indexOf(prefix) > -1))
      .map((ic) => ({
        name: ic.field_name,
        value: ic.field_name,
        score: 2,
        meta: `Column (type: ${ic.soql_type})`,
        doc: renderColumnDoc,
        column: ic
      }));

      const scope = this.props.scope;
      const possibleFuncs = scope
        .filter((spec) => (exact ? spec.name === prefix : spec.name.indexOf(prefix) > -1))
        .map((spec) => ({
          name: spec.name,
          value: spec.name,
          score: 1,
          meta: 'function',
          doc: renderFunctionDoc,
          spec
        }));

      return possibleColumns.concat(possibleFuncs);
    };
  }

  compilationFailed() {
    if (this.props.compiler) {
      return this.props.compiler.result.type === COMPILATION_FAILED;
    }
    return false;
  }

  genDesiredColumns(expr) {
    return this.props.outputColumns.map(oc => {
      if (this.props.compiler && oc.id === this.props.outputColumn.id) {
        // this is our target column - change the expr
        return buildNewOutputColumn(oc, () => expr);
      } else {
        // these ones are unchanged
        return cloneOutputColumn(oc);
      }
    });
  }


  evaluateExpr() {
    if (!this.compilationFailed() && this.props.compiler) {
      const expr = this.props.compiler.expression;
      if (expr !== null) {
        this.props.newOutputSchema(
          this.props.inputSchema,
          expr,
          this.genDesiredColumns(expr)
        );
      }
    }
  }

  render() {
    const props = {
      transform: this.props.transform,
      inputColumns: this.props.inputColumns,
      expression: this.props.transform.transform_expr,
      scope: this.props.scope,
      compiler: this.props.compiler,
      compileExpression: (expr) => {
        if (this.props.compiler) {
          this.props.compileExpression(this.props.compiler, expr);
        }
      }
    };

    const evaluateButton = !this.compilationFailed() ?
      (<button className={styles.evaluateButton} onClick={this.evaluateExpr}>
        {SubI18n.run_transform}
        <SocrataIcon name={'play'} />
      </button>) : (<button className={styles.cannotEvaluateButton}>
        {SubI18n.compile_fail}
        <SocrataIcon name={'failed'} />
      </button>);

    return (
      <div className={styles.container}>
        <div className={styles.editor}>
          <div className={styles.buttonBar}>
            {evaluateButton}
          </div>

          <div className={styles.builder}>
            <div className={styles.compositionPane}>
              <SoQLEditor {...props} completeExpression={this.genExpressionCompleter()} />
            </div>
            <div className={styles.resultsPane}>
              <SoQLResults
                params={this.props.params}
                inputSchema={this.props.inputSchema}
                outputSchema={this.props.outputSchema}
                outputColumn={this.props.outputColumn}
                location={this.props.location} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

TransformColumn.propTypes = {
  location: PropTypes.object.isRequired,
  transform: PropTypes.object.isRequired,
  newOutputSchema: PropTypes.func.isRequired,
  outputColumn: PropTypes.object.isRequired,
  outputColumns: PropTypes.array.isRequired,
  outputSchema: PropTypes.object.isRequired,
  inputSchema: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  scope: PropTypes.array.isRequired,
  compiler: PropTypes.object,
  compileExpression: PropTypes.func.isRequired,
  addCompiler: PropTypes.func.isRequired,
  inputColumns: PropTypes.array.isRequired
};

export default TransformColumn;
