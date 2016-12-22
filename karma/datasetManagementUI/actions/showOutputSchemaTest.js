import { push } from 'react-router-redux';
import { updateActions } from 'actions/showOutputSchema';
import { batch, insertSucceeded, insertFromServerIfNotExists } from 'actions/database';

describe('actions/showOutputSchema', () => {
  it('Updates the database when a new column is added', () => {
    // Inputs.
    const inputSchema = {id: 1, upload_id: 0};
    const oldSchema = {input_schema_id: inputSchema.id, id: 3};
    const schemas = [inputSchema, oldSchema];
    const newSchema = {input_schema_id: inputSchema.id};

    const pathname = '/dataset/n/feed-cafe/updates/0/uploads/0/schemas/1/output/3';
    const routing = { 'locationBeforeTransitions': {
      'pathname': pathname,
      'search': '',
      'hash': '',
      'action': 'PUSH',
      'key': 'abcdef',
      'query':{}
    }};


    const oldColIds = [5, 7];
    const newColId = 11;
    const newSchemaId = 23;
    const transformId = 29;

    const resp = {resource: {
      id: newSchemaId,
      output_columns: [
        {id: 5},
        {id: 7},
        {id: newColId,
         transform_to: {
           id: transformId,
           transform_input_columns: [
             {ignored_field: 'these are not the droids you are looking for', column_id: 13},
             {column_id: 17}
           ]
         }}
      ]
    }};

    const oldSchemaColumns = oldColIds.map(
      id => insertFromServerIfNotExists('schema_columns', {column_id: id, schema_id: newSchemaId}));
    const newSchemaColumn = insertFromServerIfNotExists(
      'schema_columns',
      {column_id: newColId, schema_id: newSchemaId}
    );

    // Expected.
    const expected = [
      insertSucceeded('schemas', {input_schema_id: inputSchema.id}, {id: newSchemaId}),
      insertFromServerIfNotExists('columns', {id: newColId}),
      batch(_.concat(oldSchemaColumns, newSchemaColumn)),
      insertFromServerIfNotExists('transforms', {id: transformId, input_column_ids: [13, 17]}),
      push(pathname.replace(/3$/, newSchemaId))
    ];

    const actions = updateActions(schemas, routing, oldSchema, newSchema, oldColIds, resp);

    expect(_.filter(actions, act => typeof(act) !== 'function')).to.deep.equal(expected);
  });
});
