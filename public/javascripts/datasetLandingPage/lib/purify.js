import DOMPurify from 'dompurify';

export default function purify(source) {
  if (!_.isString(source) || _.isEmpty(source)) {
    return source;
  }

  var allowedTags = ['a', 'b', 'br', 'div', 'em', 'i', 'p', 'span', 'strong', 'sub', 'sup', 'u'];
  var allowedAttr = ['href', 'target', 'rel'];

  return DOMPurify.sanitize(source, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttr
  });
}
