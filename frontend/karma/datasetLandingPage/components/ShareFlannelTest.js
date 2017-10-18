import _ from 'lodash';
import { assert } from 'chai';
import ShareFlannel from 'components/ShareFlannel';
import mockView from 'data/mockView';

describe('components/ShareFlannel', () => {
  const getProps = (props) => _.defaultsDeep({}, props, {
    onClickShareOption: _.noop,
    view: mockView
  });

  it('exists if the dataset is tabular', () => {
    const element = renderComponentWithStore(ShareFlannel, getProps());
    assert.ok(element);
  });

  it('exists if the dataset is blobby or an href', () => {
    const element = renderComponentWithStore(ShareFlannel, getProps({
      onClickShareOption: _.noop,
      view: {
        isBlobby: true
      }
    }));

    assert.ok(element);
  });

  it('renders all share links', () => {
    const element = renderComponentWithStore(ShareFlannel, {
      onClickShareOption: _.noop,
      view: mockView,
      flannelOpen: true
    });

    assert.ok(element.querySelector('.facebook'));
    assert.ok(element.querySelector('.twitter'));
    assert.ok(element.querySelector('.email'));
  });
});
