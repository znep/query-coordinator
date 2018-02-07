import 'babel-polyfill';
import _ from 'lodash';

import StorytellerEnvironment from 'StorytellerEnvironment';
import mainTranslations from '../../config/locales/en/main.yml';
import editorTranslations from '../../config/locales/en/editor.yml';
import adminTranslations from '../../config/locales/en/admin.yml';
import inspirationCategoryListTranslations from '../../config/locales/en/inspiration_category_list.yml';

function requireAll(context) {
  return context.keys().map(context);
}

const translations = _.merge(
  {},
  mainTranslations,
  editorTranslations,
  adminTranslations,
  inspirationCategoryListTranslations
);

beforeEach(() => {
  StorytellerEnvironment.TRANSLATIONS = translations.en;
});

requireAll(require.context('.', true, /\.spec\.js$/));
