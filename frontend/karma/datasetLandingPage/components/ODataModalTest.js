import { assert } from 'chai';
import ODataModal from 'components/ODataModal';
import mockView from 'data/mockView';

describe('components/ODataModal', function() {
  const getProps = (props) => _.defaultsDeep({}, props, {
    view: mockView
  });

  it('renders an element', function() {
    var element = renderComponentWithStore(ODataModal, {
      onClickCopy: _.noop,
      view: mockView
    });

    assert.ok(element);
  });

  it('renders odata service options', () => {
    const element = renderComponentWithStore(ODataModal, getProps({
      onClickCopy: _.noop,
      view: {
        odataUrl: '/v2/odata/link',
        odataUrlV4: '/v4/odata/link'
      }
    }));

    const dropDownOptions = element.querySelectorAll('.dropdown-options-list .picklist-option');

    assert.ok(dropDownOptions);
    assert.equal(dropDownOptions.length, 2);
  });
});
