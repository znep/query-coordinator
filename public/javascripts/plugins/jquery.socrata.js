/**
 * Socrata public Javascript API
 *
 * Note: Currently has no external CSS dependencies to avoid stomping on native page content.  Please keep CSS inline
 * at the moment.
 *
 * Author: Greg Lauckhart
 */

(function($) {
    var FONT_CSS = 'font-size: 12px; line-height: 15px; font-family: monaco, lucida console, fixed;';
    var OUTER_PADDING = 20;
    var TOKEN_CSS = 'color: #dddddd;';
    var LITERAL_CSS = 'color: #ffff44;';
    var ERROR_CSS = 'color: #ff4444;';
    var TAG_CSS = 'color: #00ffff;';
    var ATTR_CSS = 'color: #dddddd';
    var HELLO_HTML = '<div>Welcome to the Socrata console.  Type <span style="font-style: italic;">help</span> for help.</div>'
    var HELP_HTML = '<div>This is the Socrata console.  Syntax is largely JavaScript.  Built-in commands include:</div>' +
        '<div><span style="padding-left: 20px; font-style: italic;">help</span> - print this help</div>' +
        '<div><span style="padding-left: 20px; font-style: italic;">exit</span> - close the console (or type <span style="font-style: italic;">ctrl-shift-g</span> or <span style="font-style: italic;">command-shift-g</span>)</div>' +
        '<div><span style="padding-left: 20px; font-style: italic;">clear</span> - clear the console</div>' +
        '<div>To invoke APIs, use get(<span style="font-style: italic;">url</span>, <span style="font-style: italic;">params</span>) or post(<span style="font-style: italic;">url</span>, <span style="font-style: italic;">params</span>, <span style="font-style: italic;">body</span>).</div>';

    var $console;
    var $inner;
    var $input;
    var $output;

    var defaultRoot = document.location.protocol + "//" + document.location.host;

    var needOutput;

    var escapeHtml = function(text) {
        return text.replace(/</g, '&lt;');
    }

    var escapeAttr = function(text) {
        return escapeHtml(text).replace(/"/g, '&quot;').replace(/&/, '&apos;');
    }

    var scroll = function() {
        $inner.parent().attr('scrollTop', $inner.attr("scrollHeight"));
    }

    var print = function(output, $target) {
        if (!$target) {
            $target = $('<div></div>');
            $output.append($target);
        }
        $target.html(output);
        scroll();
    }
    
    var literalPrefix = "<span style='" + LITERAL_CSS + "'>";
    var literalSuffix = "</span>";
    var tagPrefix = "<span style='" + TAG_CSS + "'>";
    var tagSuffix = "</span>";
    var attrPrefix = "<span style='" + ATTR_CSS + "'>";
    var attrSuffix = "</span>";

    var printObject = function(output, $target) {
        if (output instanceof Document) {
            printObject(output.documentElement, $target);
            return;
        }

        var pretty = [ "<pre style='", FONT_CSS, ' ', TOKEN_CSS, "; margin: 0'>" ];
        
        var addObject = function(node, prefix) {
            if (node == null || node.constructor == Date) {
                pretty.push(literalPrefix, '' + node, literalSuffix);
                return;
            }
            switch (typeof node) {
                case 'number':
                case 'boolean':
                    pretty.push(literalPrefix, node, literalSuffix);
                    break;

                case 'string':
                    pretty.push(literalPrefix, '"', escapeHtml(node.replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/"/g, "\\\"")), '"', literalSuffix);
                    break;

                case 'object':
                    var prefix2 = prefix + '    ';
                    if (node instanceof Node) {
                        switch (node.nodeType) {
                            case 1:
                                pretty.push("&lt;", tagPrefix, node.tagName, tagSuffix);
                                for (var i = 0; i < node.attributes.length; i++) {
                                    var attr = node.attributes[i];
                                    pretty.push(' ', escapeHtml(escapeAttr(attr.name)), '=', literalPrefix, '"', escapeHtml(escapeAttr(attr.value)), '"', literalSuffix);
                                }
                                if (!node.childNodes) {
                                    pretty.push("/>");
                                    break;
                                }
                                pretty.push(">");
                                var hasChildElements;
                                for (i = 0; i < node.childNodes.length; i++) {
                                    var child = node.childNodes[i];
                                    if (child instanceof Element) {
                                        hasChildElements = true;
                                        break;
                                    }
                                }
                                for (i = 0; i < node.childNodes.length; i++) {
                                    var child = node.childNodes[i];
                                    if (hasChildElements)
                                        pretty.push("\n", prefix2);
                                    addObject(child, prefix2);
                                }
                                if (hasChildElements)
                                    pretty.push("\n", prefix);
                                pretty.push("&lt;/", tagPrefix, node.tagName, tagSuffix, ">");
                                break;

                            case 3:
                                pretty.push(literalPrefix, escapeHtml(escapeHtml(node.textContent.trim())), literalSuffix);
                                break;
                        }
                    } else if ($.isArray(node)) {
                        pretty.push("[");
                        for (i = 0; i < node.length; i++) {
                            if (i)
                                pretty.push(",");
                            pretty.push("\n", prefix2);
                            addObject(node[i], prefix2);
                        }
                        if (node.length)
                            pretty.push("\n");
                        pretty.push(prefix, "]");
                    } else {
                        pretty.push("{");
                        var didOne = false;
                        for (var key in node) {
                            if (didOne)
                                pretty.push(",")
                            else
                                didOne = true;
                            var value = node[key];
                            pretty.push("\n", prefix2);
                            pretty.push(escapeHtml(key), ": ");
                            addObject(node[key], prefix2);
                        }
                        if (didOne)
                            pretty.push("\n");
                        pretty.push(prefix, "}");
                    }
                    break;

                default:
                    pretty.push("(", typeof node, ")");
                    break;
            }
        }

        addObject(output, "");

        pretty.push("</pre>");

        print(pretty.join(''), $target);
    }

    var commandHistory = [];
    var commandHistoryPosition;
    var editingCommand;

    var printError = function(error, $target) {
        error = (error + "").trim();
        if (error == "")
            error = "Error (no details available)";
        if (typeof error == "string")
            print('<span style="' + ERROR_CSS + '">' + escapeHtml(error) + '</span>', $target);
        else
            printObject(error, $target);
    }

    var clear = function() {
        needOutput = false;
        $output.html('');
    }

    var help = function() {
        needOutput = false;
        print(HELP_HTML);
    }

    var execute = function(command) {
        if (commandHistory[commandHistory.length - 1] != command)
            commandHistory.push(command);
        commandHistoryPosition = commandHistory.length;
        var escapedCommand = escapeHtml(command);
        $output.append('<div>socrata&gt;&nbsp;' + escapedCommand + '</div>');

        try {
            needOutput = true;
            command = $.trim(command + '');
            if (command == '') {
                scroll();
                return;
            }
            output = eval("(" + command + ")");
            if (typeof output == 'function')
                output = output();
            if (needOutput)
                printObject(output);
        } catch (e) {
            printError(e + '');
        }
    }
    
    var buildApi = function(definition) {
        console.debug(definition);
    }

    var ajax = function(method, url, params, options) {
        $outputNode = $('<div><div style="background: transparent url(' + defaultRoot + '/images/shell-spinner.gif) no-repeat 0 50%;">&nbsp;</div></div>')
        $output.append($outputNode);
        needOutput = false;

        if (url.substr(0, 5) != "http:" && url.substr(0, 6) != "https:") {
            if (url[0] != "/")
                url = "/" + url;
            url = defaultRoot + "/api" + url;
        }
        if (params) {
            params = $.param(params);
            if (params) {
                if (url.indexOf("?") != -1)
                    url += "?";
                else
                    url += "&";
            }
        }

        options = $.extend(options || {}, {
            url: url,
            cache: false,

            success: function(result) {
                try {
                    printObject(result, $outputNode);
                } catch (e) {
                    printError(e + '', $outputNode);
                }
            },

            error: function(xhr) {
                var response = xhr.responseText;
                switch (xhr.getResponseHeader("Content-Type")) {
                    case "application/json":
                        var response = eval("(" + xhr.responseText + ")");
                        break;

                    default:
                        var response = "Error: " + xhr.status + " " + xhr.statusText;
                }
                printError(response, $outputNode);
            }
        });

        $.ajax(options);
        scroll();
    }

    var get = function(url, params, options) {
        ajax("get", url, params, options);
    }

    var post = function(url, params, body, options) {
        if (!options)
            options = {};
        if (body == null)
            body = '';
        options.body = body;
        ajax("post", url, params, options);
    }

    var exit = function() {
        needOutput = false;
        $console.hide();
    }

    var createConsole = function() {
        // TODO:
        /*
        $.ajax({
            url: '/api/docs.json',
            success: buildApi
        });
        */

        $console = $('<div style="background: transparent url(' + defaultRoot + '/images/75pct-black.png); position: fixed; top: 0; left: 0; right: 0; bottom: 0; ' + FONT_CSS + ' overflow: auto; padding: ' + OUTER_PADDING + 'px; z-index: 1000001; color: #00ff00;">' +
            '<div class="__socrata-console-inner__">' +
            '<div class="__socrata-console-output__">' + HELLO_HTML + '</div>' +
            '<table class="__socrata-console-input__" width="100%" style="padding: 0; margin: 0; border: none; border-collapse: collapse"><tr>' +
            '<td style="' + FONT_CSS + '; padding: 0">socrata&gt;&nbsp;</td>' +
            '<td width="100%" style="padding: 0"><input autocomplete="off" style="margin-left: -1px; border: none; background: transparent; overflow: visible; color: #00ff00; width: 100%; ' + FONT_CSS + ' padding: 0; height: 15px; outline: none;"/></td>' +
            '</table>' +
            '</div></div>');
        $inner = $console.children();
        $console.click(function() {
            $input.focus();
        });
        document.body.appendChild($console[0]);
        $output = $inner.find('.__socrata-console-output__');
        $input = $inner.find('.__socrata-console-input__ input')
            .keypress(function(event) {
                scroll();

                if (event.ctrlKey || event.altKey || event.shiftKey)
                    return;

                switch(event.keyCode) {
                case 13:
                    var command = $input.val();
                    $input.val('');
                    execute(command);
                    break;

                case 38:
                    if (commandHistoryPosition) {
                        if (commandHistoryPosition == commandHistory.length)
                            editingCommand = $input.val();
                        $input.val(commandHistory[--commandHistoryPosition]);
                    }
                    break;

                case 40:
                    if (commandHistoryPosition < commandHistory.length) {
                        commandHistoryPosition++;
                        if (commandHistoryPosition == commandHistory.length)
                            $input.val(editingCommand);
                        else
                            $input.val(commandHistory[commandHistoryPosition]);
                    }
                    break;

                default:
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
            });
    }

    var $window = $(window);

    $.socrata = function(options) {
        if (!options)
            options = {};
        if (options.rootURL)
            defaultRoot = options.rootURL;
        if (!$console)
            createConsole();
        else if ($console.is(':visible'))
            exit();
        else
            $console.show();
        if ($console.is(':visible'))
            $input.focus();
    }
    
    $.socrata.exec = function(code) {
        if (!$console || !$console.is(':visible'))
            $.socrata();
        if (code == null)
            code = "";
        else
            code = code + "";
        execute(code + "");
    }

    if (window.SOCRATA_SHELL_KEY !== false) {
        $(document).keydown(function(event) {
            if (event.shiftKey && (event.ctrlKey || event.metaKey) && (event.keyCode == 71 || event.keyCode == 103)) {
                event.preventDefault();
                event.stopPropagation();
                $.socrata();
                return false;
            }
        });
    }
})(jQuery);
