/*
Copyright (c) 2013 Kates Gasis, Himanshu Gilani

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * HTML2Markdown - An HTML to Markdown converter.
 *
 * This implementation uses HTML DOM parsing for conversion. Parsing code was
 * abstracted out in a parsing function which should be easy to remove in favor
 * of other parsing libraries.
 *
 * Converted MarkDown was tested with ShowDown library for HTML rendering. And
 * it tries to create MarkDown that does not confuse ShowDown when certain
 * combination of HTML tags come together.
 *
 * @author Himanshu Gilani
 * @author Kates Gasis (original author)
 *
 */

/**
 * HTML2Markdown
 * @param html - html string to convert
 * @return converted markdown text
 */
function HTML2Markdown(html, opts) {
  var logging = false;
  var nodeList = [];
  var listTagStack = [];
  var linkAttrStack = [];
  var blockquoteStack = [];
  var preStack = [];
  var codeStack = [];

  var links = [];

  opts = opts || {};
  var inlineStyle = opts['inlineStyle'] || false;

  var markdownTags = {
    "hr": "- - -\n\n",
    "br": "  \n",
    "title": "# ",
    "h1": "# ",
    "h2": "## ",
    "h3": "### ",
    "h4": "#### ",
    "h5": "##### ",
    "h6": "###### ",
    "b": "**",
    "strong": "**",
    "i": "_",
    "em": "_",
    "dfn": "_",
    "var": "_",
    "cite": "_",
    "span": " ",
    "ul": "* ",
    "ol": "1. ",
    "dl": "- ",
    "blockquote": "> "
  };

  function getListMarkdownTag() {
    var listItem = "";
    if(listTagStack) {
      for ( var i = 0; i < listTagStack.length - 1; i++) {
        listItem += "  ";
      }
    }
    listItem += peek(listTagStack);
    return listItem;
  }

  function convertAttrs(attrs) {
    var attributes = {};
    for(var k in attrs) {
      var attr = attrs[k];
      attributes[attr.name] = attr;
    }
    return attributes;
  }

  function peek(list) {
    if(list && list.length > 0) {
      return list.slice(-1)[0];
    }
    return "";
  }

  function peekTillNotEmpty(list) {
    if(!list) {
      return "";
    }

    for(var i = list.length - 1; i>=0; i-- ){
      if(list[i] != "") {
        return list[i];
      }
    }
    return "";
  }

  function removeIfEmptyTag(start) {
    var cleaned = false;
    if(start == peekTillNotEmpty(nodeList)) {
      while(peek(nodeList) != start) {
        nodeList.pop();
      }
      nodeList.pop();
      cleaned = true;
    }
    return cleaned;
  }

  function sliceText(start) {
    var text = [];
    while(nodeList.length > 0 && peek(nodeList) != start) {
      var t = nodeList.pop();
      text.unshift(t);
    }
    return text.join("");
  }

  function block(isEndBlock) {
    var lastItem = nodeList.pop();
    if (!lastItem) {
      return;
    }

    if(!isEndBlock) {
      var block;
      if(/\s*\n\n\s*$/.test(lastItem)) {
        lastItem = lastItem.replace(/\s*\n\n\s*$/, "\n\n");
        block = "";
      } else if(/\s*\n\s*$/.test(lastItem)) {
        lastItem = lastItem.replace(/\s*\n\s*$/, "\n");
        block = "\n";
      } else if(/\s+$/.test(lastItem)) {
        block = "\n\n";
      } else {
        block = "\n\n";
      }

      nodeList.push(lastItem);
      nodeList.push(block);
    } else {
      nodeList.push(lastItem);
      if(!lastItem.endsWith("\n")) {
        nodeList.push("\n\n");
      }
    }
  }

  function listBlock() {
    if(nodeList.length > 0) {
      var li = peek(nodeList);

      if(!li.endsWith("\n")) {
        nodeList.push("\n");
      }
    } else {
      nodeList.push("\n");
    }
  }

  try {
    var dom;
    if(html) {
    var e = document.createElement('div');
      e.innerHTML = html;
      dom = e;
    } else {
      dom = window.document.body;
    }

    HTMLParser(dom,{
      start: function(tag, attrs, unary) {
        tag = tag.toLowerCase();
        if(logging) {
          console.log("start: "+ tag);
        }

        if(unary && (tag != "br" && tag != "hr" && tag != "img")) {
          return;
        }

      switch (tag) {
        case "br":
          nodeList.push(markdownTags[tag]);
          break;
        case "hr":
          block();
          nodeList.push(markdownTags[tag]);
          break;
        case "title":
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          block();
          nodeList.push(markdownTags[tag]);
          break;
        case "b":
        case "strong":
        case "i":
        case "em":
        case "dfn":
        case "var":
        case "cite":
          nodeList.push(markdownTags[tag]);
          break;
        case "code":
        case "span":
          if(preStack.length > 0)
          {
            break;
          } else if(! /\s+$/.test(peek(nodeList))) {
            nodeList.push(markdownTags[tag]);
          }
          break;
        case "p":
        case "div":
        //case "td":
          block();
          break;
        case "ul":
        case "ol":
        case "dl":
          listTagStack.push(markdownTags[tag]);
          // lists are block elements
          if(listTagStack.length > 1) {
            listBlock();
          } else {
            block();
          }
          break;
        case "li":
        case "dt":
          var li = getListMarkdownTag();
          nodeList.push(li);
          break;
        case "a":
          var attribs = convertAttrs(attrs);
          linkAttrStack.push(attribs);
          nodeList.push("[");
          break;
        case "img":
          var attribs = convertAttrs(attrs);
          var alt, title, url;

          attribs["src"] ? url = getNormalizedUrl(attribs["src"].value) : url = "";
          if(!url) {
            break;
          }

          attribs['alt'] ? alt = attribs['alt'].value.trim() : alt = "";
          attribs['title'] ? title = attribs['title'].value.trim() : title = "";

          // if parent of image tag is nested in anchor tag use inline style
          if(!inlineStyle && !peekTillNotEmpty(nodeList).startsWith("[")) {
            var l = links.indexOf(url);
            if(l == -1) {
              links.push(url);
              l=links.length-1;
            }

            block();
            nodeList.push("![");
            if(alt!= "") {
              nodeList.push(alt);
            } else if (title != null) {
              nodeList.push(title);
            }

            nodeList.push("][" + l + "]");
            block();
          } else {
            //if image is not a link image then treat images as block elements
            if(!peekTillNotEmpty(nodeList).startsWith("[")) {
              block();
            }

            nodeList.push("![" + alt + "](" + url + (title ? " \"" + title + "\"" : "") + ")");

            if(!peekTillNotEmpty(nodeList).startsWith("[")) {
              block(true);
            }
          }
          break;
        case "blockquote":
          //listBlock();
          block();
          blockquoteStack.push(markdownTags[tag]);
          break;
        case "pre":
          block();
          preStack.push(true);
          nodeList.push("    ");
          break;
        case "table":
          nodeList.push("<table>");
          break;
        case "thead":
          nodeList.push("<thead>");
          break;
        case "tbody":
          nodeList.push("<tbody>");
          break;
        case "tr":
          nodeList.push("<tr>");
          break;
        case "td":
          nodeList.push("<td>");
          break;
        }
      },
      chars: function(text) {
        if(preStack.length > 0) {
          text = text.replace(/\n/g,"\n    ");
        } else if(text.trim() != "") {
          text = text.replace(/\s+/g, " ");

          var prevText = peekTillNotEmpty(nodeList);
          if(/\s+$/.test(prevText)) {
            text = text.replace(/^\s+/g, "");
          }
        } else {
          // SOCRATA - Dylan Bussone - 2/6/2015
          // Fix for issue where whitespace inbetween tags was being removed:
          // nodeList.push("");
          nodeList.push(text);
          return;
        }

        if(logging) {
          console.log("text: "+ text);
        }

        //if(blockquoteStack.length > 0 && peekTillNotEmpty(nodeList).endsWith("\n")) {
        if(blockquoteStack.length > 0) {
          nodeList.push(blockquoteStack.join(""));
        }

        nodeList.push(text);
      },
      end: function(tag) {
        tag = tag.toLowerCase();
        if(logging) {
          console.log("end: "+ tag);
        }

      switch (tag) {
        case "title":
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          if(!removeIfEmptyTag(markdownTags[tag])) {
            block(true);
          }
          break;
        case "p":
        case "div":
        //case "td":
          while(nodeList.length > 0 && peek(nodeList).trim() == "") {
            nodeList.pop();
          }
          block(true);
          break;
        case "b":
        case "strong":
        case "i":
        case "em":
        case "dfn":
        case "var":
        case "cite":
          if(!removeIfEmptyTag(markdownTags[tag])) {
            nodeList.push(sliceText(markdownTags[tag]).trim());
            nodeList.push(markdownTags[tag]);
          }
          break;
        case "a":
          var text = sliceText("[");
          text = text.replace(/\s+/g, " ");
          text = text.trim();

          if(text == "") {
            nodeList.pop();
            break;
          }

          var attrs = linkAttrStack.pop();
          var url;
          attrs["href"] &&  attrs["href"].value != "" ? url = getNormalizedUrl(attrs["href"].value) : url = "";

          if(url == "") {
            nodeList.pop();
            nodeList.push(text);
            break;
          }

          nodeList.push(text);

          if(!inlineStyle && !peek(nodeList).startsWith("!")){
            var l = links.indexOf(url);
            if(l == -1) {
              links.push(url);
              l=links.length-1;
            }
            nodeList.push("][" + l + "]");
          } else {
            if(peek(nodeList).startsWith("!")){
              var text = nodeList.pop();
              text = nodeList.pop() + text;
              block();
              nodeList.push(text);
            }

            var title = attrs["title"];
            nodeList.push("](" + url + (title ? " \"" + title.value.trim().replace(/\s+/g, " ") + "\"" : "") + ")");

            if(peek(nodeList).startsWith("!")){
              block(true);
            }
          }
          break;
        case "ul":
        case "ol":
        case "dl":
          listBlock();
          listTagStack.pop();
          break;
        case "li":
        case "dt":
          var li = getListMarkdownTag();
          if(!removeIfEmptyTag(li)) {
            var text = sliceText(li).trim();

            if(text.startsWith("[![")) {
              nodeList.pop();
              block();
              nodeList.push(text);
              block(true);
            } else {
              nodeList.push(text);
              listBlock();
            }
          }
          break;
        case "blockquote":
          blockquoteStack.pop();
          break;
        case "pre":
          //uncomment following experimental code to discard line numbers when syntax highlighters are used
          //notes this code thorough testing before production user
          /*
          var p=[];
          var flag = true;
          var count = 0, whiteSpace = 0, line = 0;
          console.log(">> " + peek(nodeList));
          while(peek(nodeList).startsWith("    ") || flag == true)
          {
            //console.log('inside');
            var text = nodeList.pop();
            p.push(text);

            if(flag == true && !text.startsWith("    ")) {
              continue;
            } else {
              flag = false;
            }

            //var result = parseInt(text.trim());
            if(!isNaN(text.trim())) {
              count++;
            } else if(text.trim() == ""){
              whiteSpace++;
            } else {
              line++;
            }
            flag = false;
          }

          console.log(line);
          if(line != 0)
          {
            while(p.length != 0) {
              nodeList.push(p.pop());
            }
          }
          */
          block(true);
          preStack.pop();
          break;
        case "code":
        case "span":
          if(preStack.length > 0)
          {
            break;
          } else if(peek(nodeList).trim() == "") {
            nodeList.pop();
            nodeList.push(markdownTags[tag]);
          } else {
            var text = nodeList.pop();
            nodeList.push(text.trim());
            nodeList.push(markdownTags[tag]);
          }
          break;
        case "table":
          nodeList.push("</table>");
          break;
        case "thead":
          nodeList.push("</thead>");
          break;
        case "tbody":
          nodeList.push("</tbody>");
          break;
        case "tr":
          nodeList.push("</tr>");
          break;
        case "td":
          nodeList.push("</td>");
          break;
        case "br":
        case "hr":
        case "img":
          break;
        }

      }
    }, {"nodesToIgnore": ["script", "noscript", "object", "iframe", "frame", "head", "style", "label"]});

    if(!inlineStyle) {
      for ( var i = 0; i < links.length; i++) {
        if(i == 0) {
          var lastItem = nodeList.pop();
          nodeList.push(lastItem.replace(/\s+$/g, ""));
          nodeList.push("\n\n[" + i + "]: " + links[i]);
        } else {
          nodeList.push("\n[" + i + "]: " + links[i]);
        }
      }
    }
  } catch(e) {
    console.log(e.stack);
    console.trace();
  }

  return nodeList.join("");

}

function getNormalizedUrl(s) {
  var urlBase = location.href;
  var urlDir  = urlBase.replace(/\/[^\/]*$/, '/');
  var urlPage = urlBase.replace(/#[^\/#]*$/, '');

  var url;
  if(/^[a-zA-Z]([a-zA-Z0-9 -.])*:/.test(s)) {
    // already absolute url
    url = s;
  } else if(/^\x2f/.test(s)) {// %2f --> /
    // url is relative to site
    location.protocol != "" ? url = location.protocol + "//" : url ="";
    url+= location.hostname;
    if(location.port != "80") {
      url+=":"+location.port;
    }
    url += s;
  } else if(/^#/.test(s)) {
    // url is relative to page
    url = urlPage + s;
  } else {
    url = urlDir + s;
  }
  return encodeURI(url);
}

if (typeof exports != "undefined") {
  exports.HTML2Markdown = HTML2Markdown;
}

if (typeof exports != "undefined") {
  exports.HTML2MarkDown = HTML2MarkDown;
}

/* add the useful functions to String object*/
if (typeof String.prototype.trim != 'function') {
  String.prototype.trim = function() {
    return replace(/^\s+|\s+$/g,"");
  };
}

if (typeof String.prototype.isNotEmpty != 'function') {
  String.prototype.isNotEmpty = function() {
    if (/\S/.test(this)) {
        return true;
    } else {
      return false;
    }
  };
}

if (typeof String.prototype.replaceAll != 'function') {
  String.prototype.replaceAll = function(stringToFind,stringToReplace){
      var temp = this;
      var index = temp.indexOf(stringToFind);
          while(index != -1){
              temp = temp.replace(stringToFind,stringToReplace);
              index = temp.indexOf(stringToFind);
          }
          return temp;
  };
}

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function(str) {
    return this.indexOf(str) == 0;
  };
}

if (typeof String.prototype.endsWith != 'function') {
  String.prototype.endsWith = function(suffix) {
      return this.match(suffix+"$") == suffix;
  };
}

if (typeof Array.prototype.indexOf != 'function') {
  Array.prototype.indexOf = function(obj, fromIndex) {
    if (fromIndex == null) {
      fromIndex = 0;
    } else if (fromIndex < 0) {
      fromIndex = Math.max(0, this.length + fromIndex);
    }
    for ( var i = fromIndex, j = this.length; i < j; i++) {
      if (this[i] === obj)
        return i;
    }
    return -1;
  };
}
