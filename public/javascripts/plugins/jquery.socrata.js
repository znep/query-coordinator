/**
 * Socrata public Javascript API
 *
 * Note: Currently has no external CSS dependencies to avoid stomping on native page content.  Please keep CSS inline
 * at the moment.
 *
 * Author: Greg Lauckhart
 */

(function($) {
    var HELLO_HTML = '<div>Welcome to the Socrata Open Data API console.  Type <code>help</code> for help.</div>'
    var HELP_HTML = '<div>This is the Socrata Open Data API console.  Syntax is largely JavaScript.  Built-in commands include:</div>' +
        '<div><code>help</code> - print this help</div>' +
        '<div><code>exit</code> - close the console (or type <code>ctrl-shift-g</code> or <code>command-shift-g</code>)</div>' +
        '<div><code>clear</code> - clear the console</div>' +
        '<div>To invoke APIs, use <code>get(url, params)</code> or <code>post(url, params, body)</code>.</div>';

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
    
    var literalPrefix = "<span class=\"literal\">";
    var literalSuffix = "</span>";
    var tagPrefix = "<span class=\"tag\">";
    var tagSuffix = "</span>";
    var attrPrefix = "<span class=\"attr\">";
    var attrSuffix = "</span>";

    var printObject = function(output, $target) {
        if (output.documentElement && (output.nodeType == 9)) {
            printObject(output.documentElement, $target);
            return;
        }

        var pretty = [ "<pre class=\"token\">" ];
        
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
        error = (error + "").replace(/^\s+|\s+$/g, '');
        if (error == "")
            error = "Error (no details available)";
        if (typeof error == "string")
            print('<span class="error">' + escapeHtml(error) + '</span>', $target);
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
        $output.append('<div>soda&gt;&nbsp;' + escapedCommand + '</div>');

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
        $outputNode = $('<div><div class="spinner" style="">&nbsp;</div></div>')
        $output.append($outputNode);
        needOutput = false;

        if (!url.match(/^(https?:|\/)/))
            url = '/' + url;
        if (!url.match(/^\/api/))
            url = defaultRoot + "/api" + url;

        if (params) {
            params = $.param(params);
            if (params) {
                if (url.indexOf("?") == -1)
                    url += "?" + params;
                else
                    url += "&" + params;
            }
        }

        if (options && options.body && (method.match(/post|put/i)))
        {
            options.data = options.body;
            options.contentType = 'application/json';
            options.dataType = 'json';
        }

        options = $.extend(options || {}, {
            type: method,
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

        $console = $('<div class="console">' +
            '<div class="__socrata-console-inner__">' +
            '<div class="__socrata-console-output__">' + HELLO_HTML + '</div>' +
            '<table class="console-input __socrata-console-input__" width="100%"><tr>' +
            '<td class="no-padding">soda&gt;&nbsp;</td>' +
            '<td width="100%" class="no-padding"><input autocomplete="off" class="console-entry"/></td>' +
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
