export function replaceTimestamps(parent$) {
  parent$.find('.time-stamp').each((i, el) => {
    const $el = $(el);
    const seconds = $el.data('epoch-seconds');
    const theMoment = moment.unix(seconds);
    $el.find('span').text(theMoment.format('D MMM YYYY [at] HH:mm:ss Z'));
  });
}

$(() => {
  replaceTimestamps($(document.body));
});
