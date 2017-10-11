import _ from 'lodash';


const languages = {
  'en': [/^jan(u?)(a?)(r?)(y?)$/,
         /^feb(r?)(u?)(a?)(r?)(y?)$/,
         /^mar(c?)(h?)$/,
         /^apr(i?)(l?)$/,
         /^may$/,
         /^jun(e?)/,
         /^jul(y?)/,
         /^aug(u?)(s?)(t?)$/,
         /^sep(t?)(e?)(m?)(b?)(e?)(r?)$/,
         /^oct(o?)(b?)(e?)(r?)$/,
         /^nov(e?)(m?)(b?)(e?)(r?)$/,
         /^dec(e?)(m?)(b?)(e?)(r?)$/],
  'ru': [/^янв(а?)(р?)(ь?)$/,
         /^фев(р?)(а?)(л?)(ь?)$/,
         /^мар(т?)$/,
         /^апр(е?)(л?)(ь?)$/,
         /^май$/,
         /^июн(ь?)$/,
         /^июл(ь?)$/,
         /^авг(у?)(с?)(т?)$/,
         /^сен(ь?)(т?)(я?)(б?)(р?)(ь?)$/,
         /^окт(я?)(б?)(р?)(ь?)$/,
         /^ноя(б?)(р?)(ь?)$/,
         /^дек(а?)(б?)(р?)(ь?)$/]
};


export const monthIndex = (candidateMonth, language = null) => {
  if (_.isNull(candidateMonth)) {
    return undefined;
  }
  const candidate = _.trim(_.lowerCase(candidateMonth));
  const checkLanguageMonth = (language, candidate) => {
    const res = _.findIndex(languages[language], (month) => month.test(candidate));
    return (res !== -1 ? res : undefined);
  };
  if (language) {
    return checkLanguageMonth(language, candidate);
  } else {
    // autodetect the language
    for (const language in languages) {
      const res = checkLanguageMonth(language, candidate);
      if (!_.isUndefined(res)) {
        return res;
      }
    }
    return undefined;
  }
};


export const detectLanguage = (candidate) => {
  for (const language in languages) {
    const months = languages[language];
    if (!_.isUndefined(monthIndex(candidate, language))) {
      return language;
    }
  }
  return undefined;
};
