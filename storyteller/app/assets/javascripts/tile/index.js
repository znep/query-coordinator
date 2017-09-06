import $ from 'jquery';
import 'common/site_wide';

(function() {

  function ellipsifyText($element, lineCount) {
    var elementHeight = $element.height();
    var lineHeight = Math.ceil(parseFloat($element.css('line-height')));
    var targetElementHeight = lineHeight * lineCount;
    var words;
    var truncatedWords;
    var ellipsifiedText;

    if (Math.floor(lineCount) !== lineCount) {
      throw new Error('`lineCount` must be an integer');
    }

    if (elementHeight > targetElementHeight) {
      words = $element.text().split(' ');

      if (words[words.length - 1] === '…') {
        truncatedWords = words.slice(0, -2);
      } else {
        truncatedWords = words.slice(0, -1);
      }

      ellipsifiedText = truncatedWords.join(' ') + '…';

      // Check for punctuation immediately preceding the ellipsis, which looks
      // stupid and should be removed.
      if (ellipsifiedText.match(/^.*[^a-zA-Z0-9]…$/) !== null) {

        ellipsifiedText = ellipsifiedText.substring(
          0,
          ellipsifiedText.length - 2
        ) + '…';
      }

      $element.text(ellipsifiedText);

      if (truncatedWords.length > 0) {
        ellipsifyText($element, lineCount);
      }
    }
  }

  $(document).ready(function() {

    // Chrome and Firefox support the document.fonts API, which exposes a `ready`
    // promise that can be used to execute code after web fonts are fully loaded.
    if (document.fonts) {

      document.fonts.ready.then(function() {
        ellipsifyText($('.tile-title'), 1);
        ellipsifyText($('.tile-description'), 3);
        $('.tile').addClass('rendered');
      });
    // IE, meanwhile, does not, so we will have to rely on a timeout. This means
    // that if for some reason the timeout fires before the web fonts are loaded
    // we will have incorrect truncation (although it is likely to truncate too
    // much, instead of not enough).
    } else {

      setTimeout(function() {
        ellipsifyText($('.tile-title'), 1);
        ellipsifyText($('.tile-description'), 2);
        $('.tile').addClass('rendered');
      }, 200);
    }
  });
})();
