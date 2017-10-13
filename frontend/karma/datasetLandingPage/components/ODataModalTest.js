import _ from 'lodash';
import { assert } from 'chai';
import ODataModal from 'components/ODataModal';
import mockView from 'data/mockView';

describe('components/ODataModal', () => {
  const getProps = (props) => _.defaultsDeep({}, props, {
    view: mockView,
    onDownloadData: _.noop,
    onClickCopy: _.noop
  });

  it('renders an element', () => {
    const element = renderComponentWithStore(ODataModal, {
      onClickCopy: _.noop,
      view: mockView
    });

    assert.ok(element);
  });

  it('renders odata service options', () => {
    const element = renderComponentWithStore(ODataModal, getProps({
      view: {
        odataUrl: '/v2/odata/link',
        odataUrlV4: '/v4/odata/link'
      }
    }));

    const dropDownOptions = element.querySelectorAll('.option');

    assert.ok(dropDownOptions);
    assert.equal(dropDownOptions.length, 2);
  });
});
