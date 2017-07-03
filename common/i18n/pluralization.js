import _ from 'lodash';
import pluralRuleParser from 'cldrpluralruleparser/src/CLDRPluralRuleParser';
import cldrData from 'cldr-core/supplemental/plurals.json';

// I18nJS expects a response in the shape of ['one', 'other'].
// You are supposed to plug this function into I18nJS:
// - I18nJS.pluralization[I18nJS.locale] = pluralization(I18nJS.locale);
//
// The way this works is thus:
// 1. This function determines which plural rules qualify for this locale and number combo.
// 2. The returned array is used to determine which sub-key is used for the translation.
// 
// Example:
// The number 4 in locale `foo` matches the rules `two`, `few`, and `other`.
// - function(locale) returns ['two', 'few', 'other'].
// For the current translation, `bar`, we have the sub-keys `bar.few` and `bar.other`.
// - foo:
//     bar:
//       few: A few bars.
//       other: ALL THE BARS.
// So we'll check for `bar.two`, see it's missing, and then checks `bar.few`, finds it,
// and selects it as the correct translation to display.
//
export default function(locale) {
  return (count) => {
    const rulesForLocale = cldrData.supplemental['plurals-type-cardinal'][locale];
    return _.filter(
      // convert 'pluralRule-count-one` to `one`.
      _.map(_.keys(rulesForLocale), (key) => { return _.last(key.split('-')); }),
      (rCount) => {
        const rule = rulesForLocale[`pluralRule-count-${rCount}`];
        return pluralRuleParser(rule, count);
      }
    );
  }
}
