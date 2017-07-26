// get input and output schemas from dummy data
const iss = _.flatMap(
  window.initialState.revision.sources,
  r => r.resource.schemas
);

const oss = _.flatMap(iss, is => is.output_schemas);

const srcs = window.initialState.revision.sources.map(s => s.resource);

// build up mock ws channels
const one = _.flatMap(oss, os =>
  os.output_columns.map(oc => ({
    channel: `transform_progress:${oc.transform.id}`,
    evt: 'max_ptr',
    msg: { end_row_offset: 5 }
  }))
);

const two = _.flatMap(oss, os =>
  os.output_columns.map(oc => ({
    channel: `transform_progress:${oc.transform.id}`,
    evt: 'errors',
    msg: { errors: 0 }
  }))
);

const three = oss.map(os => ({
  channel: `output_schema:${os.id}`,
  msg: os,
  evt: 'update'
}));

const four = iss.map(is => ({
  channel: `row_errors:${is.id}`,
  evt: 'errors',
  msg: { errors: 0 }
}));

const five = srcs.map(src => ({
  channel: 'source:823',
  evt: 'insert_input_schema',
  msg: src.schemas[0]
}));

export const bootstrapChannels = [...one, ...two, ...three, ...four, ...five];
