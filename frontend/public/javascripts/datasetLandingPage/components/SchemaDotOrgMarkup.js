import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getDownloadLink, getMimeType } from 'common/downloadLinks';
import { formatRawDateAsISO8601 } from 'common/dates';

/*
The purpose of this class is to encompass specific Schema.org metadata markup
that may be difficult to put next to the elements themselves. It should be
invisible to the naked eye.

This implementation uses the DSLP's concept of a view, which is _not_ a core view
and as such is not generalizable.

Why not just put this markup on the items themselves as they already exist on
primer? Explanations for each below:

- links that don't exist anywhere on the page
  - a permalink (/d) to the primer page
  - a link to the landing page for this dataset on the ODN
- download links
  - Primer page groups these into featured and other links. Schema.org wants
    them all in a collection
- license
  - The license on the primer page is often an image. We need a URL or text.
- tags/categories
  - tags on the primer page have commas
  - we want to downcase both tags and categories

There are other tags (name, description, ...) that belong with
the surface representation of those objects.

See:
https://developers.google.com/search/docs/data-types/datasets
http://schema.org/docs/gs.html#microdata_how
*/

export const Taxonomy = Object.freeze({
  CREATIVE_WORK: 'http://schema.org/CreativeWork',
  DATA_DOWNLOAD: 'http://schema.org/DataDownload',
  DATASET: 'http://schema.org/Dataset',
  ORGANIZATION: 'http://schema.org/Organization'
});

export const ItemProps = Object.freeze({
  CONTENT_URL: 'contentUrl',
  DATE_CREATED: 'dateCreated',
  DATE_MODIFIED: 'dateModified',
  DATE_PUBLISHED: 'datePublished',
  DISTRIBUTION: 'distribution',
  FILE_FORMAT: 'fileFormat',
  KEYWORDS: 'keywords',
  LICENSE: 'license',
  NAME: 'name',
  SAME_AS: 'sameAs',
  URL: 'url'
});

export class SchemaDotOrgMarkup extends Component {

  renderItemProp(prop, content) {
    return <meta itemProp={prop} content={content} />;
  }

  renderDownloadLink(format, viewUid, cname, key) {
    const mimeType = getMimeType(format);
    const downloadLink = getDownloadLink(viewUid, format, cname);

    return (
      <div key={key} itemScope itemProp={ItemProps.DISTRIBUTION} itemType={Taxonomy.DATA_DOWNLOAD}>
        <span itemProp={ItemProps.FILE_FORMAT} content={mimeType} />
        <link itemProp={ItemProps.CONTENT_URL} content={downloadLink} />
      </div>
    );
  }

  renderODNLink() {
    const { view, cname } = this.props;
    const viewUid = view.id;
    const ODNLink = `https://www.opendatanetwork.com/dataset/${cname}/${viewUid}`;

    return this.renderItemProp(ItemProps.SAME_AS, ODNLink);
  }

  renderUrl() {
    const { href } = this.props;
    return this.renderItemProp(ItemProps.URL, href);
  }

  renderPermalink() {
    const { view, cname, protocol } = this.props;
    const viewUid = view.id;
    const permalink = `${protocol}//${cname}/d/${viewUid}`;

    return this.renderItemProp(ItemProps.SAME_AS, permalink);
  }

  renderDistributions() {
    const { view, cname } = this.props;
    const viewUid = view.id;
    const exportFormats = view.exportFormats;

    return _.map(_.compact(exportFormats), (format, i) =>
      this.renderDownloadLink(format, viewUid, cname, i));
  }

  renderLicense() {
    const { view } = this.props;
    const coreView = view.coreView;

    const license = _.get(coreView, 'license');
    if (_.isEmpty(license)) { return null; }

    const licenseName = license.name;
    const licenseUrl = license.termsLink;

    if (_.isEmpty(licenseName)) { return null; }

    return (
      <div itemScope itemProp={ItemProps.LICENSE} itemType={Taxonomy.CREATIVE_WORK}>
        <meta itemProp={ItemProps.NAME} content={licenseName} />
        <meta itemProp={ItemProps.URL} content={licenseUrl} />
      </div>
    );
  }

  renderTags() {
    const { view } = this.props;
    const tags = view.tags;

    return _.map(_.compact(tags), (tag, i) =>
      <meta key={i} itemProp={ItemProps.KEYWORDS} content={tag.toLowerCase()} />);
  }

  renderCategory() {
    const { view } = this.props;
    const category = view.category;

    if (_.isEmpty(category)) { return null; }

    return <meta itemProp={ItemProps.KEYWORDS} content={category.toLowerCase()} />;
  }

  renderCreationDates() {
    const { view } = this.props;
    const coreView = view.coreView;

    const createdAt = _.get(coreView, 'createdAt');

    if (createdAt == null) { return null; }

    const formattedCreatedAt = formatRawDateAsISO8601(createdAt);

    // Google is requesting that we return both createdAt and publishedAt.
    // I'm not sure what the difference should be.
    return (
      <div>
        <meta itemProp={ItemProps.DATE_CREATED} content={formattedCreatedAt} />
        <meta itemProp={ItemProps.DATE_PUBLISHED} content={formattedCreatedAt} />
      </div>
    );
  }

  renderModificationDate() {
    const { view } = this.props;
    const coreView = view.coreView;

    const updatedAt = _.get(coreView, 'rowsUpdatedAt');

    if (updatedAt == null) { return null; }

    return (
      <meta itemProp={ItemProps.DATE_MODIFIED} content={formatRawDateAsISO8601(updatedAt)} />
    );
  }

  render() {
    return (
      <div>
        {this.renderUrl()}
        {this.renderPermalink()}
        {this.renderDistributions()}
        {this.renderLicense()}
        {this.renderTags()}
        {this.renderCategory()}
        {this.renderCreationDates()}
        {this.renderModificationDate()}
        {this.renderODNLink()}
      </div>
    );
  }
}

SchemaDotOrgMarkup.propTypes = {
  // Note that the `view` is not actually a view as returned by core!
  view: PropTypes.shape({
    id: PropTypes.string.isRequired, // This is technically the only thing that is _required_
    category: PropTypes.string,
    coreView: PropTypes.shape({
      license: PropTypes.shape({
        name: PropTypes.string,
        termsLink: PropTypes.string
      }),
      createdAt: PropTypes.number
    }),
    exportFormats: PropTypes.arrayOf(PropTypes.string),
    gridUrl: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  cname: PropTypes.string.isRequired,
  protocol: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired
};

function mapStateToProps({ view }) {
  return {
    view,
    cname: window.location.hostname,
    protocol: window.location.protocol,
    href: window.location.href
  };
}

export default connect(mapStateToProps)(SchemaDotOrgMarkup);
