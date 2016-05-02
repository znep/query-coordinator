import { FeedbackPanel } from 'components/FeedbackPanel';
import mockView from 'data/mockView';

describe('components/FeedbackPanel', function() {
  it('renders nothing when a user is not logged in', function() {
    var element = renderComponent(FeedbackPanel, {
      view: mockView
    });

    expect(element).to.not.exist;
  });
  it('renders an element when a user is logged in', function() {
    window.currentUser = {};
    var element = renderComponent(FeedbackPanel, {
      view: mockView
    });

    expect(element).to.exist;
  });
});
