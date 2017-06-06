import _ from 'lodash';
import InfoPane from 'components/InfoPane';
import { renderComponent } from '../helpers';
import { Simulate } from 'react-addons-test-utils';

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
});