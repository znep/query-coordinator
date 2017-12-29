export default {
  coreView: {
    name: 'Test Measure',
    description: 'A description of the measure'
  },
  mode: 'EDIT',
  measure: {
    metadata: {
      analysis: 'Some analysis text',
      methods: 'Some methods text'
    },
    metricConfig: {
      type: 'count',
      label: 'Units',
      arguments: {}
    }
  }
};
