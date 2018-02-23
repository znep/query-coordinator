import $ from 'jquery';
import _ from 'lodash';

import { shallow } from 'enzyme';
import React from 'react';
import { Simulate } from 'react-dom/test-utils';

import InfoPane from 'components/InfoPane';
import { renderComponent } from '../helpers';

describe('InfoPane', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      name: 'A Different View',
      description: 'A description',
      category: 'Fun',
      provenance: 'official',
      provenanceIcon: 'official2',
      isPrivate: true,
      footer: "Athlete's Footer",
      metadata: {
        first: {
          label: 'Updated',
          content: 'Today'
        },
        second: {
          label: 'View count',
          content: 1
        }
      }
    });
  }

  const getName = (element) => element.querySelector('.info-pane-name');
  const getOfficial = (element) => element.querySelector('.tag-official');
  const getCommunity = (element) => element.querySelector('.tag-community');
  const getPrivateIcon = (element) => element.querySelector('.socrata-icon-private');
  const getButtons = (element) => element.querySelector('.entry-actions');
  const getToggle = (element) => element.querySelector('.collapse-info-pane-btn');
  const getContent = (element) => element.querySelector('.entry-content');

  describe('header', () => {
    it('renders a name', () => {
      const element = renderComponent(InfoPane, getProps());
      assert.equal(getName(element).textContent, 'A Different View');
    });

    describe('when provenance is official', () => {
      it('renders the correct badge', () => {
        const element = renderComponent(InfoPane, getProps({ provenance: 'official', provenanceIcon: 'official2' }));
        assert.notEqual(getOfficial(element), null);
      });

      it('does not render the badge when hideProvenance is true', () => {
        const element = renderComponent(InfoPane, getProps({ provenance: 'official', provenanceIcon: 'official2', hideProvenance: true }));
        assert.equal(getOfficial(element), null);
        assert.equal(getCommunity(element), null);
      });
    });

    describe('when provenance is community', () => {
      it('renders the correct badge', () => {
        const element = renderComponent(InfoPane, getProps({ provenance: 'community', provenanceIcon: 'community' }));
        assert.equal(getOfficial(element), null);
        assert.notEqual(getCommunity(element), null);
      });

      it('does not render the badge when hideProvenance is true', () => {
        const element = renderComponent(InfoPane, getProps({ provenance: 'community', provenanceIcon: 'community', hideProvenance: true }));
        assert.equal(getOfficial(element), null);
        assert.equal(getCommunity(element), null);
      });
    });

    it('renders a lock icon when isPrivate is set', () => {
      const element = renderComponent(InfoPane, getProps());
      assert.notEqual(getPrivateIcon(element), null);
    });

    it('does not render a lock icon when isPrivate is not set', () => {
      const element = renderComponent(InfoPane, getProps({ isPrivate: false }));
      assert.equal(getPrivateIcon(element), null);
    });

    it('renders buttons using the specified function', () => {
      const element = renderComponent(InfoPane, getProps({
        renderButtons: () => { return 'button'; }
      }));

      assert.equal(getButtons(element).textContent, 'button');
    });
  });

  describe('when isPaneCollapsible is false', () => {
    let element;

    beforeEach(() => {
      element = renderComponent(InfoPane, getProps({ isPaneCollapsible: false }));
    });

    it('does not render the More/Less Info toggle', () => {
      assert.equal(getToggle(element), null);
    });

    it('displays the entry-content', () => {
      const contentClass = getContent(element).attributes.class.value;
      assert.isNotTrue(contentClass.includes('hide'));
    });
  });

  describe('when isPaneCollapsible is true', () => {
    let element;

    beforeEach(() => {
      element = renderComponent(InfoPane, getProps({ isPaneCollapsible: true }));
    });

    it('renders the More Info toggle', () => {
      assert.notEqual(getToggle(element), null);
      assert.isNotTrue(getToggle(element).textContent.includes('Less Info'));
      assert.isTrue(getToggle(element).textContent.includes('More Info'));
    });

    it('does not display the entry-content', () => {
      const contentClass = getContent(element).attributes.class.value;
      assert.isTrue(contentClass.includes('hide'));
    });

    describe('when the More Info toggle is clicked', () => {
      beforeEach(() => {
        Simulate.click(getToggle(element));
      });

      it('displays the entry-content', () => {
        const contentClass = getContent(element).attributes.class.value;
        assert.isNotTrue(contentClass.includes('hide'));
      });

      it('displays the Less Info toggle', () => {
        assert.notEqual(getToggle(element), null);
        assert.isTrue(getToggle(element).textContent.includes('Less Info'));
        assert.isNotTrue(getToggle(element).textContent.includes('More Info'));
      });
    });
  });

  /**
   * The metadata prop is an object meant to contain two arbitrary pieces of metadata about the
   * asset.  The two sections are named "first" and "second" and should be objects, each
   * containing a "label" and "content" key.  They are rendered to the right of the description.
   */
  describe('metadata prop', () => {
    const props = getProps();
    let element;

    before(() => {
      element = renderComponent(InfoPane, props);
    });

    describe('first field', () => {
      it('renders the title', () => {
        // See TODO in InfoPane/index.js re: confusing class names.
        assert.equal($(element).find('.entry-meta.updated .meta-title').text(), props.metadata.first.label);
      });

      it('renders the content', () => {
        // See TODO in InfoPane/index.js re: confusing class names.
        assert.equal($(element).find('.entry-meta.updated .date').text(), props.metadata.first.content);
      });
    });

    describe('second field', () => {
      it('renders the title', () => {
        // See TODO in InfoPane/index.js re: confusing class names.
        assert.equal($(element).find('.entry-meta.views .meta-title').text(), props.metadata.second.label);
      });

      it('renders the content', () => {
        // See TODO in InfoPane/index.js re: confusing class names.
        assert.equal($(element).find('.entry-meta.views .date').text(), props.metadata.second.content);
      });
    });
  });

  describe('when there is no content for the lower section', () => {
    it('renders nothing', () => {
      const element = renderComponent(InfoPane, { name: 'Just the Title' });
      assert.isNull(getContent(element));
    });
  });

  describe('description', () => {
    it('does not crash with a null description', () => {
      const instance = shallow(<InfoPane description={null} />);
      assert.doesNotThrow(() => {
        // Bug was going from a null description to a set description.
        instance.setProps({ description: 'foo' });
        instance.setProps({ description: null });
      });
    });
  });

  describe('metadata watch dataset flag', () => {
    describe('showWatchDatasetFlag is enabled', () => {
      it('should show watch dataset flag as blocked eye icon if watching', () => {
        const element = renderComponent(InfoPane, getProps({ showWatchDatasetFlag: true, subscribed: true }));
        assert.ok(element.querySelector('.watch-dataset-flag'));
        assert.ok(element.querySelector('.socrata-icon-watched'));
      });

      it('should show watch dataset flag as eye icon if not watching', () => {
        const element = renderComponent(InfoPane, getProps({ showWatchDatasetFlag: true, subscribed: false }));
        assert.ok(element.querySelector('.watch-dataset-flag'));
        assert.ok(element.querySelector('.socrata-icon-watch'));
      });

      describe('when there is only a `first` metadata item', () => {
        it('should show watch dataset flag only in the first metadata item', () => {
          const props = getProps({ showWatchDatasetFlag: true });
          // N.B. defaultsDeep (used in getProps) does _not_ allow you to remove items.
          delete props.metadata.second;
          const element = renderComponent(InfoPane, props);
          assert.lengthOf(element.querySelectorAll('.watch-dataset-flag'), 1);
          // See TODO in InfoPane/index.js re: confusing class names.
          assert.lengthOf(element.querySelectorAll('.entry-meta.updated .watch-dataset-flag'), 1);
        });
      });

      describe('when there is only a `second` metadata item', () => {
        it('should show watch dataset flag only in the second metadata item', () => {
          const props = getProps({ showWatchDatasetFlag: true });
          // N.B. defaultsDeep (used in getProps) does _not_ allow you to remove items.
          delete props.metadata.first;
          const element = renderComponent(InfoPane, props);
          assert.lengthOf(element.querySelectorAll('.watch-dataset-flag'), 1);
          // See TODO in InfoPane/index.js re: confusing class names.
          assert.lengthOf(element.querySelectorAll('.entry-meta.views .watch-dataset-flag'), 1);
        });
      });

      // TODO: Is this really the expected behavior?
      describe('when there are no metadata fields', () => {
        describe('because there is no metadata prop set', () => {
          it('should hide watch dataset flag', () => {
            const props = getProps({ showWatchDatasetFlag: true });
            // N.B. defaultsDeep (used in getProps) does _not_ allow you to remove items.
            delete props.metadata;
            const element = renderComponent(InfoPane, props);
            assert.isNull(element.querySelector('.watch-dataset-flag'));
          });
        });

        describe('because the metadata prop does includes neither `first` nor `second`', () => {
          it('should hide watch dataset flag', () => {
            // N.B. defaultsDeep (used in getProps) does _not_ allow you to override items
            // with empty objects.
            const props = getProps({ showWatchDatasetFlag: true });
            props.metadata = {};
            const element = renderComponent(InfoPane, props);
            assert.isNull(element.querySelector('.watch-dataset-flag'));
          });
        });
      });
    });

    describe('showWatchDatasetFlag is disabled', () => {
      it('should hide watch dataset flag', () => {
        const element = renderComponent(InfoPane, getProps({ showWatchDatasetFlag: false }));
        assert.isNull(element.querySelector('.watch-dataset-flag'));
      });
    });
  });

  describe('awaiting approval message', () => {
    const getViewPropWithApprovalState = (approvalState) => ({
      coreView: {
        approvals: [{
          outcome: 'publicize',
          state: approvalState
        }]
      }
    });

    it('does not explode if a view is not present in the props', () => {
      const props = { isPrivate: true, view: undefined };
      const element = renderComponent(InfoPane, getProps(props));
      assert.isNull(element.querySelector('.awaiting-approval-message'));
    });

    it('does not render when an asset is public', () => {
      const props = { isPrivate: false, view: undefined };
      const element = renderComponent(InfoPane, getProps(props));
      assert.isNull(element.querySelector('.awaiting-approval-message'));
    });

    it('does not render when an asset is private and not pending approval', () => {
      const props = { isPrivate: true, view: getViewPropWithApprovalState('rejected') };
      const element = renderComponent(InfoPane, getProps(props));
      assert.isNull(element.querySelector('.awaiting-approval-message'));
    });

    it('renders when an asset is private and pending approval', () => {
      const props = { isPrivate: true, view: getViewPropWithApprovalState('pending') };
      const element = renderComponent(InfoPane, getProps(props));
      assert.ok(element.querySelector('.awaiting-approval-message'));
    });
  });
});
