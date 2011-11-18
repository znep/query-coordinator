(function($) {
    var $translator;

    $.cf.translate = function() {
        if ($translator) {
            var $kill = $translator;
            $translator = null;
            $kill.fadeOut('fast', 'linear', function() {
                $kill.remove();
            });
            return;
        }

        var lang1 = $.cookies.get('translate-lang1') || $.locale.fallback || $.locale.current || '';
        var lang2 = $.cookies.get('translate-lang2') || $.locale.current || '';
        if (lang1 == lang2)
            lang2 = '';
        lang1 = lang1.replace(/_/g, '-');
        lang2 = lang2.replace(/_/g, '-');

        $translator = $($.tag({
            tagName: 'div', 'class': 'socrata-cf-translator', contents: [
                { tagName: 'h2', contents: [ 'Edit Translations', { tagName: 'a', href: '#done', 'class': 'done', contents: 'done' } ] },
                { tagName: 'table', width: '80%', contents: {
                    tagName: 'tr', contents: [
                        { tagName: 'th', contents: 'Item Name' },
                        { tagName: 'th', contents: 'Global?' },
                        { tagName: 'th', width: '50%', contents: { tagName: 'input', type: 'text',
                            'class': 'language1 textInput', value: lang1 } },
                        { tagName: 'th', width: '50%', contents: { tagName: 'input', type: 'text',
                            'class': 'language2 textInput', value: lang2 } }
                    ]
                }}
            ]
        }));
        $translator.fadeIn('fast', 'linear');
        $(document.body).append($translator);

        var tokens = [];
        $.component.eachRoot(function(root) {
            root.listTemplateSubstitutions(tokens);
        });
        tokens = _.uniq(_.map(tokens, function(token) { return token.replace(/:.*/, '') }).sort(), true);

        var presentLocales = [ 'en', $.locale.current, $.locale.fallback ].concat($.locale.globals.available(),
                $.locale.locals.available());

        var locales = [];
        _.each(presentLocales, function(locale) {
            var pieces = locale.toLowerCase().split(/[_\-]/);
            var str;
            _.each(pieces, function(piece) {
                if (!str)
                    str = piece;
                else
                    str += '-' + piece;
                locales.push(str);
            });
        });
        if (lang1)
            locales.push(lang1);
        if (lang2)
            locales.push(lang2);

        locales = _.map(_.uniq(locales.sort(), true), function(locale) { return { name: locale }; });

        $translator.find('input.language1, input.language2').awesomecomplete({
            staticData: locales,

            renderFunction: function(item) {
                return '<div>' + item.name + '</div>'
            }
        }).focus(function() {
            $(this).select();
        });
        var $lang1i = $translator.find('input.language1');
        var $lang2i = $translator.find('input.language2');

        $lang1i.data('awesomecomplete-config').blurFunction = function() {
            setTimeout(function() {
                var newLang1 = $lang1i.val();
                if (newLang1 == lang1)
                    return;
                if (newLang1 == lang2) {
                    $lang1i.val(lang1);
                    return;
                }
                lang1 = newLang1;
                $.cookies.set('translate-lang1', lang1);
                fillCells(lang1, lang1Inputs);
            }, 1);
        };

        $lang2i.data('awesomecomplete-config').blurFunction = function() {
            setTimeout(function() {
                var newLang2 = $lang2i.val();
                if (newLang2 == lang2)
                    return;
                if (newLang2 == lang1) {
                    $lang2i.val(lang2);
                    return;
                }
                lang2 = newLang2;
                $.cookies.set('translate-lang2', lang2);
                fillCells(lang2, lang2Inputs);
            }, 1);
        };

        var $table = $translator.find('table');
        var lang1Inputs = [];
        var lang2Inputs = [];
        _.each(tokens, function(token) {
            if (token.charAt(0) != '@')
                return;
            token = token.substr(1);
            var $row = $($.tag({
                tagName: 'tr', 'class': 'token', contents: [
                    { tagName: 'td', contents: $.htmlEscape(token) },
                    { tagName: 'td', contents: { tagName: 'input', type: 'checkbox', 'class': 'public', tabindex: -1 }, 'class': 'global' },

                    // TODO -- change inputs to growable textareas
                    { tagName: 'td', contents: { tagName: 'input', type: 'text', 'class': 'language1 textInput' } },
                    { tagName: 'td', contents: { tagName: 'input', type: 'text', 'class': 'language2 textInput' } }
                ]
            }));
            $table.append($row);
            lang1Inputs.push([ token, $row[0].childNodes[2].firstChild ]);
            lang2Inputs.push([ token, $row[0].childNodes[3].firstChild ]);
        });

        function fillCells(lang, inputs) {
            var locals = $.locale.locals.get(lang);
            var globals = $.locale.globals.get(lang);
            _.each(inputs, function(tokenAndInput) {
                var value = locals[tokenAndInput[0]];
                if (value) {
                    var global = false;
                } else {
                    value = globals[tokenAndInput[0]];
                    global = !!value;
                }
                if (inputs == lang1Inputs)
                    $(tokenAndInput[1]).closest('tr').children(':eq(1)').attr('checked', global);
                tokenAndInput[1].value = value || '';
            });
        }
        fillCells($lang1i.val(), lang1Inputs);
        fillCells($lang2i.val(), lang2Inputs);

        $table.delegate('tr.token input[type="text"]', 'blur', function() {
            var $this = $(this);
            var $row = $this.closest('tr');
            var language = $this.is('.language1') ? lang1 : lang2;
            var value = $(this).val();
            var token = $row.children(':eq(0)').text();
            var global = $row.find('input[type="checkbox"]').attr('checked');
            $.locale[global ? 'globals' : 'locals'].set(language, token, value);
            if (!global)
                $.locale.locals.set(token, false);
        });

        $translator.find('.done').click(function() {
            $.cf.translate();
            return false;
        });
    }
})(jQuery);
