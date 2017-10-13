import _ from 'lodash';
import { assert } from 'chai';
import ShareFlyout from 'components/ShareFlyout';
import mockView from 'data/mockView';

describe('components/ShareFlyout', () => {
  const getProps = (props) => _.defaultsDeep({}, props, {
    view: mockView
  });

  it('exists if the dataset is tabular', () => {
    const element = renderComponentWithStore(ShareFlyout, getProps());
    assert.ok(element);
  });

  it('exists if the dataset is blobby or an href', () => {
    const element = renderComponentWithStore(ShareFlyout, getProps({
      view: {
        isBlobby: true
      }
    }));

    assert.ok(element);
  });

  it('renders all share links', () => {
    const element = renderComponentWithStore(ShareFlyout, {
      onClickOption: _.noop,
      view: mockView
    });

    assert.ok(element.querySelector('.facebook'));
    assert.ok(element.querySelector('.twitter'));
    assert.ok(element.querySelector('.email'));
  });
});
