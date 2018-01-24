import { expect, assert } from 'chai';
import { PrivateNotice } from 'datasetLandingPage/components/PrivateNotice';
import mockView from '../data/mockView';

describe('components/PrivateNotice', function() {
  it('renders an element', function() {
    var element = renderComponent(PrivateNotice, {
      view: mockView
    });

    assert.ok(element);
  });
});
