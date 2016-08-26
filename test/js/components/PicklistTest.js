import _ from 'lodash';
import Picklist from 'components/Picklist';

describe('Picklist', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      options: [],
      onSelection: _.noop
    });
  }

  it('renders an element', function() {
    var element = renderComponent(Picklist, getProps());
    expect(element).to.exist;
  });
});
