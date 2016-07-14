function requireAll(context) {
  return context.keys().map(context);
}

requireAll(require.context('.', true, /\.spec\.js$/));
