import formatDate from './formatDate';
import utils from 'socrata-utils';
import { getIconClassForDisplayType } from 'socrata-components/common/displayTypeMetadata';

export function getDateLabel(updatedAt) {
  return formatDate(updatedAt);
}

export function getViewCountLabel(viewCount) {
  return `${utils.formatNumber(viewCount)} ${I18n.view_widget.views}`;
}

export function getAriaLabel(view) {
  return `${I18n.related_views.view} ${view.name}`;
}

export function getViewCardPropsForView(view) {
  return {
    ...view,
    metadataLeft: formatDate(view.updatedAt),
    metadataRight: getViewCountLabel(view.viewCount),
    icon: getIconClassForDisplayType(view.displayType),
    linkProps: {
      'aria-label': getAriaLabel(view)
    }
  };
}

export function getViewCardPropsForExternalContent(externalContent) {
  var imageUrl = externalContent.previewImage;

  if (!_.isEmpty(imageUrl) && !/^(https?:\/\/|data:)/.test(imageUrl)) {
    imageUrl = `/api/views/${window.initialState.view.id}/files/${imageUrl}`;
  }

  return {
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
