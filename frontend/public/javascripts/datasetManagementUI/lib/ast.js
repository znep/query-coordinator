import _ from 'lodash';


const stripToTextAst = (ast) => (
  ast && ast.function_name === 'to_text' ? ast.args[0] : ast
);
const stripToNumberAst = (ast) => (
  ast && ast.function_name === 'to_number' ? ast.args[0] : ast
);
const stripToBooleanAst = (ast) => (
  ast && ast.function_name === 'to_boolean' ? ast.args[0] : ast
);
const stripToDatetimeAst = (ast) => (
  ast && ast.function_name === 'to_floating_timestamp' ? ast.args[0] : ast
);

// Our AST will look like this:
// {
//   "type": "funcall",
//   "function_name": "forgive",
//   "args": [
//     {
//       "type": "funcall",
//       "function_name": "geocode",
//       "args": [
//         {
//           "value": "address",
//           "type": "column_ref"
//         },
//         {
//           "value": "city",
//           "type": "column_ref"
//         },
//         {
//           "value": "state",
//           "type": "column_ref"
//         },
//         {
//           "value": "zip",
//           "type": "column_ref"
//         }
//       ]
//     }
//   ]
// }
//
// def traverse(items, acc, fun) when is_list(items) do
//   Enum.reduce(items, acc, fn node, acc -> traverse(node, acc, fun) end)
// end
// def traverse({:funcall, _funcspec, args, _row, _col} = node, acc, fun) do
//   acc = traverse(args, acc, fun)
//   fun.(node, acc)
// end
// def traverse(node, acc, fun), do: fun.(node, acc)
function traverse(node, acc, fun) {
  if (_.isArray(node)) {
    return node.reduce((nodeAcc, subnode) => traverse(subnode, nodeAcc, fun), acc);
  } else if (node && node.type === 'funcall') {
    return fun(node, traverse(node.args, acc, fun));
  } else {
    return fun(node, acc);
  }
}

export {
  traverse,
  stripToTextAst,
  stripToNumberAst,
  stripToBooleanAst,
  stripToDatetimeAst
};
