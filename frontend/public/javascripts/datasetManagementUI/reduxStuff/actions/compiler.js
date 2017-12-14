export const COMPILER_SCOPE = 'COMPILER_SCOPE';
export const COMPILER_ADD_SUCCESS = 'COMPILER_ADD_SUCCESS';
export const COMPILER_ADD_ERROR = 'COMPILER_ADD_ERROR';
export const COMPILATION_SUCCESS = 'COMPILATION_SUCCESS';
export const COMPILATION_FAILURE = 'COMPILATION_FAILURE';
export const COMPILATION_STARTED = 'COMPILATION_STARTED';


const compilerAddSuccess = (inputSchema, channel) => ({
  type: COMPILER_ADD_SUCCESS,
  inputSchema,
  channel
});

const compilerAddError = (inputSchema) => ({
  type: COMPILER_ADD_ERROR,
  inputSchema
});

const compilerScope = (scope) => ({
  type: COMPILER_SCOPE,
  scope
});

const compilationStarted = (compiler, expression) => ({
  type: COMPILATION_STARTED,
  compiler,
  expression
});

const compilationSuccess = (compiler, expression) => ({
  type: COMPILATION_SUCCESS,
  compiler,
  expression
});

const compilationFailure = (compiler, expression, reason, line, column) => ({
  type: COMPILATION_FAILURE,
  reason,
  line,
  column
});

export const addCompiler = (inputSchema) => (dispatch, getState, socket) => {
  const channel = socket.channel(`compiler:${inputSchema.id}`);

  channel.on('scope', ({ scope }) => dispatch(compilerScope(scope)));

  channel.join()
    .receive('ok', () => dispatch(compilerAddSuccess(inputSchema, channel)))
    .receive('error', () => dispatch(compilerAddError(inputSchema)));
};

export const compileExpression = (compiler, expression) => (dispatch) => {
  dispatch(compilationStarted(compiler, expression));

  compiler.channel.push('compile', { expression })
    .receive('ok', () => dispatch(compilationSuccess(compiler, expression)))
    .receive('error', ({ reason, line, column }) => {
      dispatch(compilationFailure(compiler, expression, reason, line, column));
    });
};
