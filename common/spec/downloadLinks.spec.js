import * as downloadLinks from 'common/downloadLinks';

describe('downloadLinks', () => {
  describe('getMimeType', () => {
    it('returns text/csv for CSV formats', () => {
      assert.equal(downloadLinks.getMimeType('csv'), 'text/csv');
      assert.equal(downloadLinks.getMimeType('csv_for_excel'), 'text/csv');
      assert.equal(downloadLinks.getMimeType('csv_for_excel_europe'), 'text/csv');
    });

    it('returns application/json for the JSON format', () => {
      assert.equal(downloadLinks.getMimeType('json'), 'application/json');
    });

    it('returns application/rdfxml for the RDF format', () => {
      assert.equal(downloadLinks.getMimeType('rdf'), 'application/rdfxml');
    });

    it('returns application/rssxml for the RSS format', () => {
      assert.equal(downloadLinks.getMimeType('rss'), 'application/rssxml');
    });

    it('returns text/tab-separated-values for the TSV Excel format', () => {
      assert.equal(downloadLinks.getMimeType('tsv_for_excel'), 'text/tab-separated-values');
    });

    it('returns application/xml for the XML format', () => {
      assert.equal(downloadLinks.getMimeType('xml'), 'application/xml');
    });

    it('returns text/csv for any unknown format ¯\_(ツ)_/¯ its probably right?', () => {
      assert.equal(downloadLinks.getMimeType('gopher'), 'text/csv');
      assert.equal(downloadLinks.getMimeType('bytestream'), 'text/csv');
      assert.equal(downloadLinks.getMimeType('📈'), 'text/csv');
    });
  });

  describe('getDownloadLink', () => {
    it('returns null when supplied no parameters', () => {
      assert.equal(downloadLinks.getDownloadLink(), null);
    });

    it('returns the expected URL when only given viewUid', () => {
      assert.equal(downloadLinks.getDownloadLink('four-four'), '/api/views/four-four/rows.csv?accessType=DOWNLOAD');
    });

    it('returns the expected URL when given viewUid and format', () => {
      assert.equal(downloadLinks.getDownloadLink('four-four', 'csv'), '/api/views/four-four/rows.csv?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'json'), '/api/views/four-four/rows.json?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'rdf'), '/api/views/four-four/rows.rdf?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'rss'), '/api/views/four-four/rows.rss?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'xml'), '/api/views/four-four/rows.xml?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'csv_for_excel'), '/api/views/four-four/rows.csv?accessType=DOWNLOAD&bom=true&format=true');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'csv_for_excel_europe'), '/api/views/four-four/rows.csv?accessType=DOWNLOAD&bom=true&format=true&delimiter=%3B');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'tsv_for_excel'), '/api/views/four-four/rows.tsv?accessType=DOWNLOAD&bom=true');
    });

    it('returns the expected URL when given viewUid, format, and domainCname', () => {
      assert.equal(downloadLinks.getDownloadLink('four-four', 'csv', 'socrata.com'), 'https://socrata.com/api/views/four-four/rows.csv?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'json', 'socrata.com'), 'https://socrata.com/api/views/four-four/rows.json?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'rdf', 'socrata.com'), 'https://socrata.com/api/views/four-four/rows.rdf?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'rss', 'socrata.com'), 'https://socrata.com/api/views/four-four/rows.rss?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'xml', 'socrata.com'), 'https://socrata.com/api/views/four-four/rows.xml?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'csv_for_excel', 'socrata.com'), 'https://socrata.com/api/views/four-four/rows.csv?accessType=DOWNLOAD&bom=true&format=true');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'csv_for_excel_europe', 'socrata.com'), 'https://socrata.com/api/views/four-four/rows.csv?accessType=DOWNLOAD&bom=true&format=true&delimiter=%3B');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'tsv_for_excel', 'socrata.com'), 'https://socrata.com/api/views/four-four/rows.tsv?accessType=DOWNLOAD&bom=true');
    });

    it('returns the expected URL when given viewUid, format, domainCname, and protocol', () => {
      assert.equal(downloadLinks.getDownloadLink('four-four', 'csv', 'socrata.com', 'tcp'), 'tcp://socrata.com/api/views/four-four/rows.csv?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'json', 'socrata.com', 'tcp'), 'tcp://socrata.com/api/views/four-four/rows.json?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'rdf', 'socrata.com', 'tcp'), 'tcp://socrata.com/api/views/four-four/rows.rdf?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'rss', 'socrata.com', 'tcp'), 'tcp://socrata.com/api/views/four-four/rows.rss?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'xml', 'socrata.com', 'tcp'), 'tcp://socrata.com/api/views/four-four/rows.xml?accessType=DOWNLOAD');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'csv_for_excel', 'socrata.com', 'tcp'), 'tcp://socrata.com/api/views/four-four/rows.csv?accessType=DOWNLOAD&bom=true&format=true');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'csv_for_excel_europe', 'socrata.com', 'tcp'), 'tcp://socrata.com/api/views/four-four/rows.csv?accessType=DOWNLOAD&bom=true&format=true&delimiter=%3B');
      assert.equal(downloadLinks.getDownloadLink('four-four', 'tsv_for_excel', 'socrata.com', 'tcp'), 'tcp://socrata.com/api/views/four-four/rows.tsv?accessType=DOWNLOAD&bom=true');
    });
  });

  describe('getDownloadType', () => {
    it('returns the expected human-readable "type" for the given format', () => {
      assert.equal(downloadLinks.getDownloadType('csv'), 'CSV');
      assert.equal(downloadLinks.getDownloadType('json'), 'JSON');
      assert.equal(downloadLinks.getDownloadType('rdf'), 'RDF');
      assert.equal(downloadLinks.getDownloadType('rss'), 'RSS');
      assert.equal(downloadLinks.getDownloadType('xml'), 'XML');
      assert.equal(downloadLinks.getDownloadType('csv_for_excel'), 'CSV for Excel');
      assert.equal(downloadLinks.getDownloadType('csv_for_excel_europe'), 'CSV for Excel (Europe)');
      assert.equal(downloadLinks.getDownloadType('tsv_for_excel'), 'TSV for Excel');
    });

    it('returns the expected human-readable "type" for the given format, even if its silly', () => {
      assert.equal(downloadLinks.getDownloadType('bloomers!'), 'BLOOMERS!');
    });
  });
});
