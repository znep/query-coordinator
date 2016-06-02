import { ApiFlannel } from 'components/ApiFlannel';
import mockView from 'data/mockView';

describe('components/ApiFlannel', function() {
  it('renders an element', function() {
    var element = renderComponent(ApiFlannel, {
      onClickCopy: _.noop,
      view: mockView
    });

    expect(element).to.exist;
  });
});
