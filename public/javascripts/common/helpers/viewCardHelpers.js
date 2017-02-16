import formatDate from '../formatDate';
import utils from 'socrata-utils';
import { getIconClassForDisplayType } from 'socrata-components/common/displayTypeMetadata';

export function getDateLabel(updatedAt) {
  return formatDate(typeof updatedAt === 'object' ? updatedAt : new Date(updatedAt));
}

export const getViewCountLabel = (viewCount) => {
  const viewLabelTranslation = viewCount === 1 ? I18n.view_widget.view : I18n.view_widget.views;
  return _.isNumber(viewCount) ? `${utils.formatNumber(viewCount)} ${viewLabelTranslation}` : '';
};

export const getAriaLabel = (view) => `${I18n.related_views.view} ${view.name}`;

export function getViewCardPropsForView(view) {
  return {
    ...view,
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
