/* eslint react/jsx-boolean-value: 0 */
import * as React from 'react';
import PropTypes from 'prop-types';
import * as styles from './SoQLEditor.module.scss';
import {
  COMPILATION_EMPTY,
  COMPILATION_IN_PROGRESS,
  COMPILATION_SUCCEEDED,
  COMPILATION_FAILED
} from '../../reduxStuff/reducers/compiler';
import AceEditor from 'react-ace';
import * as ace from 'brace';
import 'brace/theme/monokai';
import 'brace/mode/sql';
import 'brace/ext/language_tools';

const { Range } = ace.acequire('ace/range');
const langTools = ace.acequire('ace/ext/language_tools');

// export interface ExpressionCompletion {
//   name: string,
//   value: string,
//   score: number,
//   meta: string,
//   doc: (expr: ExpressionCompletion) => JSX.Element | null
//   spec?: SoQLFunctionSpec,
//   column?: any // need a union type of dsmapi columns and core columns. fwiw they are identical.
// }

// interface CompilerErrorProps {
//   result: CompilationFailed,
// }

function CompilerError({ result }) {
  // this split join thing is a hack, we should make soql-reference give unformated
  // error messsages
  const klass = `${styles.compilerResult}  ${styles.compilerError}`;
  return (
    <div className={klass}>
      {result.reason.split('\n').slice(0, -1).join('\n')}
    </div>
  );
}

CompilerError.propTypes = {
  result: PropTypes.object.isRequired
};

// interface SoQLEditorProps {
//   scope: Scope,
//   expression: string,
//   completeExpression: (expression: string, exact: boolean) => Array<ExpressionCompletion>,
//   compileExpression: (expression: string) => void,
//   compiler: Compiler | null
// };
// interface SoQLEditorState {
//   expression: string,
//   selectedFunction: ExpressionCompletion | null
// };


export class SoQLEditor extends React.Component {

  constructor(props) {
    super(props);

    this.popup = null;
    this.editor = null;
    this.marker = null;

    this.state = {
      expression: props.expression,
      selectedFunction: null
    };

    this.onChange = this.onChange.bind(this);
    this.configureAutocomplete = this.configureAutocomplete.bind(this);
    this.onChangeSelection = this.onChangeSelection.bind(this);
    this.captureEscKey = this.captureEscKey.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keyup', this.captureEscKey, true);
  }

  componentWillUnmount() {
    this.maybeRemovePopupListener();
    document.removeEventListener('keyup', this.captureEscKey, true);
  }

  onChange(newCode) {
    this.setState({
      expression: newCode
    });
    this.props.compileExpression(newCode);
  }

  onChangeSelection() {
    const row = this.popup.getData(this.popup.getRow());
    this.setState({
      ...this.state,
      selectedFunction: row
    });
  }

  configureAutocomplete() {
    const completer = this.props.completeExpression;
    const self = this;

    return (editor) => {
      this.editor = editor;

      editor.on('changeSelection', () => {
        const token = editor.getSession().doc.getTextRange(editor.selection.getRange());
        this.maybeDisplayDocsForToken(token);
      });

      const aceCompleter = {
        getCompletions: function(theEditor, session, pos, prefix, callback) {
          const matches = completer(prefix, false);


          if (theEditor.completer && theEditor.completer.popup) {
            const popup = theEditor.completer.popup;
            self.popup = popup;
            popup.container.style.width = '500px';
            popup.resize();
            self.maybeRemovePopupListener();
            popup.on('changeSelection', self.onChangeSelection);
          }

          callback(null, matches);
        }
      };
      langTools.setCompleters([]);
      langTools.addCompleter(aceCompleter);
    };
  }


  // argh this is a disgusting mess, idk why ace won't let me remove it properly
  // somehow the event is firing on an unmounted component
  maybeRemovePopupListener() {
    if (this.popup) {
      this.popup.removeAllListeners('changeSelection');
    }
  }

  maybeDisplayDocsForToken(token) {
    const completions = this.props.completeExpression(token, true);
    if (completions.length) {
      this.setState({
        ...this.state,
        selectedFunction: completions[0]
      });
    }
  }

  captureEscKey(event) {
    const escapeKeyCode = 27;
    if (event.keyCode === escapeKeyCode && this.editor.$isFocused) {
      // we need to stop the event from propagating so that the parent modal doesn't also close
      event.stopPropagation();
    }
  }

  render() {
    const r = `${styles.compilerResult} `;
    let compilerResult = (<div className={r + styles.compilerResult}>
        Connecting to Compiler...
    </div>);

    if (this.editor) {
      this.editor.session.removeMarker(this.marker);
    }

    if (this.props.compiler) {
      switch (this.props.compiler.result.type) {
        case COMPILATION_EMPTY:
          compilerResult = (
            <div className={r + styles.compilerReady}>
              Compiler is ready
            </div>
          );
          break;
        case COMPILATION_IN_PROGRESS:
          compilerResult = (
            <div className={r + styles.compilerInProgress}>
              Your query is compiling...
            </div>
          );
          break;
        case COMPILATION_SUCCEEDED:
          compilerResult = (
            <div className={r + styles.compilerSuccess}>
              Query compilation successful. Click "Run" to evaluate the expression.
            </div>
          );
          break;
        case COMPILATION_FAILED:
          compilerResult = (<CompilerError result={this.props.compiler.result} />);

          if (this.editor) {
            this.marker = this.editor.session.addMarker(
              new Range(
                this.props.compiler.result.line - 1,
                this.props.compiler.result.column,
                this.props.compiler.result.line - 1,
                this.props.compiler.result.column + 1
              ),
              styles.compilerErrorUnderline,
              'fullLine',
              true
            );
          }
          break;
        default:
          throw new Error('Invalid compilation state', this.props.compiler.result.type);
      }
    }

    let expression = this.state.expression;

    let selectedFunctionDoc;
    if (this.state.selectedFunction && this.state.selectedFunction.doc) {
      selectedFunctionDoc = this.state.selectedFunction.doc(this.state.selectedFunction);
    }

    return (
      <div>
        <AceEditor
          theme="monokai"
          mode="sql"
          width="100%"
          height="640px"
          fontSize={20}
          tabSize={2}
          showGutter={true}
          onChange={this.onChange}
          name={'column-editor'}
          editorProps={{ $blockScrolling: true }}
          enableBasicAutocompletion={true}
          enableLiveAutocompletion={true}
          defaultValue={this.props.expression}
          value={expression}
          onLoad={this.configureAutocomplete()} />

        {compilerResult}

        {selectedFunctionDoc}
      </div>
    );
  }
}

SoQLEditor.propTypes = {
  compiler: PropTypes.object,
  expression: PropTypes.string.isRequired,
  completeExpression: PropTypes.func.isRequired,
  compileExpression: PropTypes.func.isRequired
};
