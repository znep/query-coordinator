import _ from 'lodash';
import { assert } from 'chai';
import mockView from '../data/mockView';
import { SchemaDotOrgMarkup } from 'datasetLandingPage/components/SchemaDotOrgMarkup';
import { mount, shallow } from 'enzyme';
import { Provider } from 'react-redux';

const store = (state = {}) => ({
  subscribe: () => {},
  dispatch: () => {},
  getState: () => state
});

describe('components/SchemaDotOrgMarkup', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      view: mockView,
      cname: 'data.socrata.gov',
      protocol: 'https:',
      href: 'https://data.socrata.gov/dataset/title/four-four'
    });
  }

  function getElement(view) {
    const props = getProps({view});
    return mount(
      <Provider store={store}>
        <SchemaDotOrgMarkup {...props} />
      </Provider>,
      { context: store(props) }
    );
  }

  describe('Keywords', () => {
    it('has the expected keywords when tags is empty but category exists', () => {
      const view = {
        tags: [],
        category: 'FUN'
      };
      const element = getElement(view);

      const nodes = element.find('meta[itemProp="keywords"]').getNodes();

      assert.equal(nodes.length, 1);
      assert.equal(nodes[0].getAttribute('content'), 'fun');
    });

    it('has the expected keywords when tags is not empty and category is empty', () => {
      const view = {
        tags: ['tag1', 'tag2'],
        category: null
      };
      const element = getElement(view);

      const nodes = element.find('meta[itemProp="keywords"]').getNodes();

      assert.equal(nodes.length, 2);
      const contents = _.map(_.compact(nodes), (node) =>
        node.getAttribute('content'));
      assert.deepEqual(contents, ['tag1', 'tag2']);
    });

    it('has the expected keywords when tags and category are present', () => {
      const view = {
        tags: ['tag1', 'TAG2'],
        category: 'ZOINKS!'
      };
      const element = getElement(view);

      const nodes = element.find('meta[itemProp="keywords"]').getNodes();

      assert.equal(nodes.length, 3);
      const contents = _.map(_.compact(nodes), (node) =>
        node.getAttribute('content'));
      assert.deepEqual(contents, ['tag1', 'tag2', 'zoinks!']);
    });
  });

  describe('URL', () => {
    it("doesn't rely on the view at all to get the URL to the current page", () => {
      const view = {};
      const element = getElement(view);
      const expectedURL = 'https://data.socrata.gov/dataset/title/four-four';
      const nodes = element.find('meta[itemProp="url"]').getNodes();

      assert.equal(nodes.length, 1);
      assert.equal(nodes[0].getAttribute('content'), expectedURL);
    });
  });

  describe('Links', () => {
    it('renders the permalink and opendatanetwork links correctly', () => {
      const view = {};
      const element = getElement(view);
      const expectedPermalink = 'https://data.socrata.gov/d/four-four';
      const expectedODNLink = 'https://www.opendatanetwork.com/dataset/data.socrata.gov/four-four';
      const nodes = element.find('meta[itemProp="sameAs"]').getNodes();

      assert.equal(nodes.length, 2);
      assert.equal(nodes[0].getAttribute('content'), expectedPermalink);
      assert.equal(nodes[1].getAttribute('content'), expectedODNLink);
    });
  });

  describe('Distribution', () => {
    it('renders the distributions correctly when all are present', () => {
      const exportFormats = ['csv', 'json', 'rdf', 'rss', 'xml', 'csv_for_excel', 'csv_for_excel_europe', 'tsv_for_excel'];
      const view = {
        exportFormats: exportFormats
      };
      const element = getElement(view);

      // Assert that we have one distribution wrapper for each export format
      const distributions = element.find('div[itemProp="distribution"]').getNodes();
      assert.equal(distributions.length, exportFormats.length);

      // Now make assertions about the values in those items
      const fileFormats = element.find('span[itemProp="fileFormat"]').getNodes();
      const contentUrls = element.find('link[itemProp="contentUrl"]').getNodes();

      const formats = _.map(_.compact(fileFormats), (node) =>
        node.getAttribute('content'));
      const urls = _.map(_.compact(contentUrls), (node) =>
        node.getAttribute('content'));

      assert.deepEqual(formats.sort(), ['text/csv', 'text/csv', 'text/csv', 'application/json',
                                        'application/rdfxml', 'application/rssxml',
                                        'text/tab-separated-values', 'application/xml'].sort());

      assert.deepEqual(urls.sort(), [
        'https://data.socrata.gov/api/views/four-four/rows.csv?accessType=DOWNLOAD',
        'https://data.socrata.gov/api/views/four-four/rows.json?accessType=DOWNLOAD',
        'https://data.socrata.gov/api/views/four-four/rows.rdf?accessType=DOWNLOAD',
        'https://data.socrata.gov/api/views/four-four/rows.rss?accessType=DOWNLOAD',
        'https://data.socrata.gov/api/views/four-four/rows.xml?accessType=DOWNLOAD',
        'https://data.socrata.gov/api/views/four-four/rows.csv?accessType=DOWNLOAD&bom=true&format=true',
        'https://data.socrata.gov/api/views/four-four/rows.csv?accessType=DOWNLOAD&bom=true&format=true&delimiter=%3B',
        'https://data.socrata.gov/api/views/four-four/rows.tsv?accessType=DOWNLOAD&bom=true'
      ].sort());
    });

    it('renders the distributions correctly when there are no export formats', () => {
      const view = {
        exportFormats: null
      };
      const element = getElement(view);

      const distributions = element.find('div[itemProp="distribution"]').getNodes();
      const fileFormats = element.find('span[itemProp="fileFormat"]').getNodes();
      const contentUrls = element.find('link[itemProp="contentUrl"]').getNodes();

      assert.isEmpty(distributions);
      assert.isEmpty(fileFormats);
      assert.isEmpty(contentUrls);
    });
  });

  describe('License', () => {
    it("doesn't render a license if there is no coreView", () => {
      const view = {
        coreView: null
      };
      const element = getElement(view);

      const licenses = element.find('div[itemProp="license"]').getNodes();

      assert.isEmpty(licenses);
    });

    it("doesn't render a license if the license object is empty", () => {
      const view = {
        coreView: {
          license: {}
        }
      };
      const element = getElement(view);

      const licenses = element.find('div[itemProp="license"]').getNodes();

      assert.isEmpty(licenses);
    });

    it("doesn't render a license if the license name is empty", () => {
      const view = {
        coreView: {
          license: {
            name: null,
            termsLink: 'http://wwww.google.com/licenses'
          }
        }
      };
      const element = getElement(view);

      const licenses = element.find('div[itemProp="license"]').getNodes();

      assert.isEmpty(licenses);
    });

    it('renders the expected license', () => {
      const view = {
        coreView: {
          license: {
            name: 'Super Duper Important License',
            termsLink: 'http://www.google.com/licenses'
          }
        }
      };
      const element = getElement(view);

      const licenseWrapper = element.find('div[itemProp="license"]');
      const license = licenseWrapper.getNodes();
      const name = licenseWrapper.find('meta[itemProp="name"]').getNodes();
      const url = licenseWrapper.find('meta[itemProp="url"]').getNodes();

      assert.equal(license.length, 1);
      assert.equal(name.length, 1);
      assert.equal(url.length, 1);

      assert.equal(name[0].getAttribute('content'), 'Super Duper Important License');
      assert.equal(url[0].getAttribute('content'), 'http://www.google.com/licenses');
    });
  });

  describe('Dates', () => {
    it('renders the expected dateCreated', () => {
      const view = {
        coreView: {
          createdAt: 1506966449
        }
      };
      const element = getElement(view);

      const dateCreated = element.find('meta[itemProp="dateCreated"]').getNodes();

      assert.equal(dateCreated.length, 1);
      assert.equal(dateCreated[0].getAttribute('content'), '2017-10-02T17:47:29.000Z');
    });

    it('renders the expected datePublished', () => {
      const view = {
        coreView: {
          createdAt: 1506966449
        }
      };
      const element = getElement(view);

      const datePublished = element.find('meta[itemProp="datePublished"]').getNodes();

      assert.equal(datePublished.length, 1);
      assert.equal(datePublished[0].getAttribute('content'), '2017-10-02T17:47:29.000Z');
    });

    it('renders the expected dateModified', () => {
      const view = {
        coreView: {
          rowsUpdatedAt: 1506966449
        }
      };
      const element = getElement(view);

      const dateModified = element.find('meta[itemProp="dateModified"]').getNodes();

      assert.equal(dateModified.length, 1);
      assert.equal(dateModified[0].getAttribute('content'), '2017-10-02T17:47:29.000Z');
    });
  });
});
