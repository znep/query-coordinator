import _ from 'lodash';

export default function(overrides) {
  return _.extend({}, {
    layout: '12',
    components: [
      {
        type: 'html',
        value: 'Hello, world!'
      }
    ]
  }, overrides);
}
