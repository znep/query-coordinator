import { expect, assert } from 'chai';
import {
  update,
  view
}
from 'components/connectToEsri';
import TestUtils from 'react-addons-test-utils';
import * as ExampleData from './exampleData';
import { withMockFetch, testThunk } from '../asyncUtils';

describe("connectToEsri's reducer", () => {
  var state;

  beforeEach(() => {
    state = {};
  });

  describe('view', () => {
    it('renders an error when there is an error', () => {
      const element = renderComponent(view({
        connectToEsri: {
          type: 'Failed',
          esriSource: {
            url: '',
            contactEmail: '',
            privacy: 'private'
          },
          error: 'Something bad happened'
        },
        dispatch: _.noop,
        goToPage: _.noop,
        goToPrevious: _.noop
      }));
      expect(element.querySelector('.metadataPane .flash-alert.error').innerHTML)
        .to.equal('Something bad happened');
    });

    it('renders the esri pane initially', () => {
      const element = renderComponent(view({
        connectToEsri: {
          type: 'NotStarted',
          esriSource: {
            url: '',
            contactEmail: '',
            privacy: 'private'
          }
        },
        dispatch: _.noop,
        goToPage: _.noop,
        goToPrevious: _.noop
      }));
      expect(element.querySelector('p.headline').innerHTML)
        .to.equal(I18n.screens.dataset_new.metadata.prompt);
    });

    it('goes to next page when next is clicked', (done) => {

      const goToPage = () => {
        done();
      }

      const element = renderComponent(view({
        connectToEsri: {
          type: 'NotStarted',
          esriSource: {
            url: 'foobar',
            contactEmail: '',
            privacy: 'private'
          }
        },
        dispatch: _.noop,
        goToPage,
        goToPrevious: _.noop
      }));

      TestUtils.Simulate.click(element.querySelector('.nextButton'))
    });

    // it('next button is disabled when there is no url', () => {

    //   const element = renderComponent(view({
    //     connectToEsri: {
    //       type: 'NotStarted',
    //       esriSource: {
    //         url: '',
    //         contactEmail: '',
    //         privacy: 'private'
    //       }
    //     },
    //     dispatch: _.noop,
    //     goToPage: _.noop,
    //     goToPrevious: _.noop
    //   }));

    //   expect(
    //     element.querySelector('.nextButton').classList.filter(
    //       (name) => name === 'disabled'
    //     )
    //   ).length.to.equal(1);
    // });
  });
});
