import formatDate from '../formatDate';
import utils from 'common/js_utils';
import { getIconClassForDisplayType } from 'socrata-components/common/displayTypeMetadata';

export function getDateLabel(updatedAt) {
  return formatDate(typeof updatedAt === 'object' ? updatedAt : new Date(updatedAt));
}

export const getViewCountLabel = (viewCount) => {
  const viewLabelTranslation = viewCount === 1 ?
    _.get(I18n, 'common.view_widget.view') : _.get(I18n, 'common.view_widget.views');
  return _.isNumber(viewCount) ? `${utils.formatNumber(viewCount)} ${viewLabelTranslation}` : '';
};

export const getAriaLabel = (view) => `${_.get(I18n, 'related_views.view')} ${view.name}`;

export function getViewCardPropsForView(view) {
  return {
    ...view,
    contentType: 'internal',
    metadataLeft: formatDate(view.updatedAt),
    metadataRight: getViewCountLabel(_.get(view, 'viewCount', 0)),
    icon: getIconClassForDisplayType(view.displayType),
    linkProps: {
      'aria-label': getAriaLabel(view)
    }
  };
}

export function getViewCardPropsForExternalContent(externalContent) {
  let imageUrl = externalContent.previewImage;

  if (!_.isEmpty(imageUrl) && !/^(https?:\/\/|data:)/.test(imageUrl)) {
    imageUrl = `/api/views/${window.initialState.view.id}/files/${imageUrl}`;
  }

  return {
    contentType: 'external',
    name: externalContent.title,
    description: externalContent.description,
    imageUrl: imageUrl,
    url: externalContent.url,
    linkProps: {
      'aria-label': getAriaLabel(externalContent)
    }
  };
}

export function getViewCardPropsForFeaturedItem(item) {
  if (item.contentType === 'internal') {
    return getViewCardPropsForView(item.featuredView);
  } else {
    return getViewCardPropsForExternalContent(item);
  }
}

export function getViewCardPropsForCLPExternalContent(externalContent) {
  return {
    contentType: 'external',
    name: externalContent.name,
    description: externalContent.description,
    imageUrl: externalContent.imageUrl,
    url: externalContent.url,
    linkProps: {
      'aria-label': getAriaLabel(externalContent)
    }
  };
}

export function getViewCardPropsForCLPFeaturedItem(item = {}) {
  if (item.contentType === 'external') {
    return getViewCardPropsForCLPExternalContent(item);
  } else {
    return getViewCardPropsForView(item);
  }
}
