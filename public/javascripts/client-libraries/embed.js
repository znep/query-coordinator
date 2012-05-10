/**
 * Javascript interface for embedding a Socrata page into a website
 * socrata.embedPage() will create an iframe with the given location, into the given dom node
 * embedPage() takes three arguments:
 *   - pageId: a dataset UID, or URL to a page
 *   - domNode: a DOM node object or a string dataset id
 *   - options: hash of other items:
 *       - domain: Domain address (without https://)
 *       - title: Sets the title property of the iframe
 *       - height: Height of the iframe in pixels (defaults to 400)
 *       - width: Width of the iframe in pixels (defaults to 500)
 *       - frameborder: Size of the visible frame (defaults to 0)
 *       - scrolling: Whether or not the iframe should scroll, 'yes' or 'no' (defaults to 'no')
 * socrata.domain can be set globally so that the domain option doesn't need to
 *   be provided on each call
 *
 * Copyright Socrata, Inc. 2012
 */

window.socrata = window.socrata || {};
window.socrata.embedPage = function(pageId, domNode, options)
{
    options = options || {};
    if (pageId === null || pageId === undefined || pageId == '') { return; }
    var url = pageId;
    var domain = options.domain || socrata.domain;
    if (pageId.match(/^\w{4}-\w{4}$/))
    { url = '/d/' + pageId; }
    if (!url.match(/^https?:\/\//) && domain !== null && domain !== undefined && domain !== '')
    { url = 'https://' + domain + (url[0] == '/' ? '' : '/') + url; }
    url += (url.indexOf('?') > -1 ? '&' : '?') + 'hide_chrome=true';
    if (typeof domNode == 'string')
    { domNode = document.getElementById(domNode); }
    if (domNode !== null && domNode !== undefined && domNode.nodeType == 1)
    {
        var iframe = document.createElement('iframe');
        iframe.setAttribute('frameborder', options.frameborder || 0);
        iframe.setAttribute('scrolling', options.scrolling || 'no');
        iframe.setAttribute('title', options.title || '');
        iframe.setAttribute('width', options.width || 500);
        iframe.setAttribute('height', options.height || 400);
        iframe.setAttribute('src', url);
        domNode.appendChild(iframe);
    }
};
