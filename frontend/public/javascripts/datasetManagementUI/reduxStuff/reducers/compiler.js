import {
  COMPILER_ADD_SUCCESS,
  COMPILER_SCOPE,
  COMPILATION_STARTED,
  COMPILATION_SUCCESS,
  COMPILATION_FAILURE
} from '../../reduxStuff/actions/compiler';

export const COMPILATION_FAILED = 'COMPILATION_FAILED';
export const COMPILATION_SUCCEEDED = 'COMPILATION_SUCCEEDED';
export const COMPILATION_EMPTY = 'COMPILATION_EMPTY';
export const COMPILATION_IN_PROGRESS = 'COMPILATION_IN_PROGRESS';

// TODO: turn these into proptypes...i guess? idk ;_;
// export type CompilerResult = CompilationSucceeded | CompilationFailed | CompilationResultEmpty | CompilationInProgress;

// export interface Compiler {
//   inputSchema: InputSchema,
//   channel: PhoenixChannel,
//   result: CompilerResult,
//   expression: string | null
// };

// type Bound = 'fixed' | 'variable';

// interface SoQLContraint {
//   [varname: string]: Array<SoQLType>
// }

// export interface SoQLTypeSpec {
//   type: SoQLType,
//   kind: Bound
// }

// export interface SoQLFunctionSpec {
//   name: string,
//   constraints: Array<SoQLContraint>,
//   result: SoQLTypeSpec,
//   sig: Array<SoQLTypeSpec>,
//   doc: string
// }

// export type Scope = Array<SoQLFunctionSpec>;

// interface CompilerState {
//   compiler: Compiler | null,
//   scope: Scope
// }

const initialState = {
  compiler: null,
  scope: []
};

const compiler = (state = initialState, action) => {
  switch (action.type) {
    case COMPILER_ADD_SUCCESS: {

      const theCompiler = {
        inputSchema: action.inputSchema,
        channel: action.channel,
        result: { type: COMPILATION_EMPTY },
        expression: null
      };
      return { ...state, compiler: theCompiler };
    }
    case COMPILER_SCOPE: {
      return { ...state, scope: action.scope };
    }
    case COMPILATION_STARTED:
      if (state.compiler) {
        return {
          ...state,
          compiler: {
            ...state.compiler,
            expression: action.expression,
            result: { type: COMPILATION_IN_PROGRESS }
          }
        };
      }
      return state;
    case COMPILATION_SUCCESS:
      if (state.compiler) {
        return {
          ...state,
          compiler: {
            ...state.compiler,
            result: { type: COMPILATION_SUCCEEDED }
          }
        };
      }
      return state;
    case COMPILATION_FAILURE:
      if (state.compiler) {
        return {
          ...state,
          compiler: {
            ...state.compiler,
            result: {
              type: COMPILATION_FAILED,
              reason: action.reason,
              line: action.line,
              column: action.column
            }
          }
        };
      }
      return state;
    default:
      return state;
  }
};

export default compiler;
