import { DownloadDropdown } from 'components/DownloadDropdown';
import mockView from 'data/mockView';

describe('components/DownloadDropdown', function() {
  it('renders an element', function() {
    var element = renderComponent(DownloadDropdown, {
      view: mockView
    });

    expect(element).to.exist;
  });
});
