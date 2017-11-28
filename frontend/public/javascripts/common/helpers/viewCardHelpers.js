import { formatDateWithLocale } from 'common/dates';
import utils from 'common/js_utils';
import { getIconClassForDisplayType } from 'common/displayTypeMetadata';
import _ from 'lodash';
import I18n from 'common/i18n';

export function getDateLabel(updatedAt) {
  return formatDateWithLocale(typeof updatedAt === 'object' ? updatedAt : new Date(updatedAt));
}

export const getViewCountLabel = (viewCount) => {
  const viewLabelTranslation = viewCount === 1 ?
    I18n.t('common.view_widget.view') : I18n.t('common.view_widget.views');
  return _.isNumber(viewCount) ? `${utils.formatNumber(viewCount)} ${viewLabelTranslation}` : '';
};

export const getResultCountLabel = (resultCount) => {
  const resultLabelTranslation = resultCount === 1 ?
    I18n.t('common.result_count_label.one') : I18n.t('common.result_count_label.other');
  return _.isNumber(resultCount) ? `${utils.formatNumber(resultCount)} ${resultLabelTranslation}` : '';
};

export const getAriaLabel = (view) => `${I18n.t('related_views.view')} ${view.name}`;

export function getViewCardPropsForView(view) {
  return {
    ...view,
    contentType: 'internal',
    metadataLeft: formatDateWithLocale(view.updatedAt),
    metadataRight: getViewCountLabel(_.get(view, 'viewCount', 0)),
    icon: getIconClassForDisplayType(view.displayType),
    linkProps: {
      'aria-label': getAriaLabel(view)
    }
  };
}

// This is needed because sometimes previewImageId is a GUID and sometimes isn't not.
export function translatePreviewImageIdToImageUrl(previewImageId) {
  let imageUrl = previewImageId;

  if (!_.isEmpty(previewImageId) && !/^(https?:\/\/|data:)/.test(previewImageId)) {
    imageUrl = `/api/views/${window.initialState.view.id}/files/${previewImageId}`;
  }

  return imageUrl;
}

export function getViewCardPropsForExternalContent(externalContent) {
  return {
    contentType: 'external',
    name: externalContent.title,
    description: externalContent.description,
    imageUrl: translatePreviewImageIdToImageUrl(externalContent.previewImageId),
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
