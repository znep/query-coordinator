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

- links
  - a permalink to the primer page doesn't exist anywhere else on the primer page
- download links
  - Primer page groups these into featured and other links. Schema.org wants
    them all in a collection. This is easier.
- license
  - The license on the primer page is often an image. We need a URL or text.
- tags/categories
  - tags on the primer page have commas
  - categories we want to downcase (dunno, just for consistency)

There are other tags (name, description, ...) that preferably belong with
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
  CREATED_AT: 'createdAt',
  DATA_PROVIDED_BY: 'dataProvidedBy',
  DISTRIBUTION: 'distribution',
  FILE_FORMAT: 'fileFormat',
  KEYWORDS: 'keywords',
  LICENSE: 'license',
  NAME: 'name',
  SAME_AS: 'sameAs',
  URL: 'url'
});

export class SchemaDotOrgMarkup extends Component {

  extractPrefix(currentPage) {
    const prefixRegex = /(\D+:\/\/.*?)\//;
    const match = currentPage.match(prefixRegex);
    if (match.length <= 1) { return null; }
    return match[1];
  }

  extractCname(currentPage) {
    const cnameRegex = /\D+:\/\/(.*?)\//;
    const match = currentPage.match(cnameRegex);
    if (match.length <= 1) { return null; }
    return match[1];
  }

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

  renderUrl() {
    const primerLink = window.location.href;
    return <meta itemProp={ItemProps.URL} content={primerLink} />;
  }

  renderPermalink() {
    const { view } = this.props;
    const viewUid = view.id;
    const prefix = this.extractPrefix(window.location.href);
    const permalink = `${prefix}/d/${viewUid}`;

    return <meta itemProp={ItemProps.SAME_AS} content={permalink} />;
  }

  renderDistributions() {
    const { view } = this.props;
    const viewUid = view.id;
    const exportFormats = view.exportFormats;
    const cname = this.extractCname(window.location.href);

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
      <meta key={i} itemProp={ItemProps.KEYWORDS} content={tag} />);
  }

  renderCategory() {
    const { view } = this.props;
    const category = view.category;

    if (_.isEmpty(category)) { return null; }

    return <meta itemProp={ItemProps.KEYWORDS} content={category.toLowerCase()} />;
  }

  renderCreatedAt() {
    const { view } = this.props;
    const coreView = view.coreView;

    const createdAt = _.get(coreView, 'createdAt');

    if (createdAt == null) { return null; }

    const formattedCreatedAt = formatRawDateAsISO8601(createdAt);

    return <meta itemProp={ItemProps.CREATED_AT} content={formattedCreatedAt} />;
  }

  renderAttribution() {
    const { view } = this.props;
    const coreView = view.coreView;

    if (_.isEmpty(coreView)) { return null; }

    const { attribution, attributionLink } = coreView;

    let attributionMeta;
    let attributionLinkMeta;
    if (_.isEmpty(attribution)) {
      attributionMeta = null;
    } else {
      attributionMeta = this.renderItemProp(ItemProps.NAME, attribution);
    }
    if (_.isEmpty(attributionLink)) {
      attributionLinkMeta = null;
    } else {
      attributionLinkMeta = this.renderItemProp(ItemProps.URL, attributionLink);
    }

    if (attributionMeta == null & attributionLinkMeta == null) { return null; }

    return (
      <div itemScope itemProp={ItemProps.DATA_PROVIDED_BY} itemScope={Taxonomy.ORGANIZATION}>
        {attributionMeta}
        {attributionLinkMeta}
      </div>
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
        {this.renderCreatedAt()}
        {this.renderAttribution()}
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
  }).isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

export default connect(mapStateToProps)(SchemaDotOrgMarkup);
