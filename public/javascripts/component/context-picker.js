;(function($) {

$.cf.contextPicker = function()
{
    return {name: 'viewId', required: true, text: 'View Data', type: 'custom',
        editorCallbacks: {create: picker, value: pickerValue, validate: pickerValidate}};
};

var picker = function($field, vals, curValue)
{
    $field.addClass('contextPicker');
    var $wrapper = $.tag({tagName: 'div', 'class': 'wrapper'});
    $field.append($wrapper);

    var $hiddenInput = $.tag({tagName: 'input', type: 'hidden', name: $field.attr('name'),
        'class': 'required', data: {'custom-4x4uid': 'req'}, value: curValue});
    $field.append($hiddenInput);

    var fullData = $.dataContext.availableContexts[curValue];
    var $textInput = $.tag({tagName: 'input', type: 'text', 'class': 'textInput',
        value: $.htmlEscape((fullData || {}).name || curValue)});
    $textInput.change(function(e)
        {
            var v = ($textInput.data('fullData') || {}).id || $textInput.value();
            if (!$.isBlank(v))
            {
                var m = v.match(/^https?:\/\/.*\/(\w{4}-\w{4})(\?.*)*$/);
                if (!$.isBlank(m)) { v = m[1]; }
            }
            $hiddenInput.value(v);
            if (!$hiddenInput.valid()) { return; }

            if ($.isBlank($.dataContext.availableContexts[v]))
            {
                e.stopPropagation();
                $.dataContext.getContext(v, function() { $textInput.change(); },
                    function(xhr)
                    {
                        var validator = $hiddenInput.closest('form').data('form-validator');
                        var errors = {};
                        errors[$hiddenInput.attr('name')] = xhr.status == 404 ?
                            'This view is not valid' : 'There was an error';
                        if ($.isBlank(validator))
                        { alert(_.first(_.values(errors))); }
                        else
                        { validator.showErrors(errors); }
                    });
            }
        })
    .focus(function() { $textInput.select(); });
    $wrapper.append($textInput);

    var $chooser = $.tag({tagName: 'a', href: '#choose', 'class': 'dropdownChooser'});
    $chooser.mousedown(function(e)
            {
                if (!$textInput.is(':focus'))
                { _.defer(function() { $textInput.focus(); }); }
            })
    .click(function(e) { e.preventDefault(); });
    $wrapper.append($chooser);

    var searchDelayTimer;
    var translateDS = function(ds)
    {
        var d = {};
        _.each(['name', 'id', 'description', 'category', 'tags'], function(key)
            { d[key] = ds[key]; });
        return d;
    };
    var matchScore = function(item, baseScore)
    {
        if (item.isTitle) { baseScore = 1000; }
        if (!item.isServer) { baseScore += 10000; }
        return baseScore;
    };
    _.defer(function()
    {
        $textInput.awesomecomplete({
            alignRight: $wrapper,
            attachTo: $field.closest('.controlPane'),
            dontMatch: ['id'],
            forcePosition: true,
            showAll: true,
            skipBlankValues: true,
            suggestionListClass: 'contextPickerAutocomplete',
            showFunction: function($list)
            {
                $field.closest('.section').closest('.socrata-cf-side').andSelf().css('overflow', 'visible');
                // If we only have a 'Current Data' title, hide it
                var $lItems = $list.find('.localItem');
                if ($lItems.length < 2) { $lItems.hide(); }
            },
            blurFunction: function()
            {
                $field.closest('.section').closest('.socrata-cf-side').andSelf().css('overflow', '');
            },
            renderFunction: function(dataItem, topMatch, config)
            {
                var div = {tagName: 'div', 'class': [{value: 'serverItem',
                    onlyIf: dataItem.isServer == 'true'},
                    {value: 'localItem', onlyIf: dataItem.isServer != 'true'}], contents: []};
                if (dataItem.isTitle)
                {
                    div['class'].push('titleSeparator');
                    div.contents.push(dataItem.name);
                }
                else if ((topMatch === config.nameField) || (topMatch === null))
                {
                    div.contents.push({tagName: 'p', 'class': 'title',
                        contents: dataItem[config.nameField]});
                }
                else
                {
                    div.contents.push({tagName: 'p', 'class': 'title',
                        contents: dataItem[config.nameField]});
                    div.contents.push({tagName: 'p', 'class': 'matchRow',
                        contents: [{tagName: 'span', 'class': 'matchedField', contents: topMatch},
                        ': ', dataItem[topMatch]]});
                }
                return $.tag(div, true);
            },
            sortFunction: function(a, b, term)
            {
                var amtc = matchScore(a.originalDataItem, a.matchedTermCount);
                var bmtc = matchScore(b.originalDataItem, b.matchedTermCount);
                return (amtc == bmtc) ?
                       (matchScore(b.originalDataItem, b.matchCount) -
                            matchScore(a.originalDataItem, a.matchCount)) :
                       (bmtc - amtc);
            },
            dataMethod: function(term, $f, dataCallback)
            {
                var d = _.map($.dataContext.availableContexts, translateDS);
                if (!_.isEmpty(d))
                { d.unshift({name: 'Currently Used Data', isTitle: true, term: term}); }
                dataCallback(d);

                clearTimeout(searchDelayTimer);
                if (!$.isBlank(term))
                {
                    searchDelayTimer = setTimeout(function()
                        {
                            Dataset.search({name: term, limit: 10}, function(results)
                                {
                                    var dataViews = [];
                                    var curData = _.map(_.values($.dataContext.availableContexts),
                                        translateDS);
                                    if (!_.isEmpty(curData))
                                    {
                                        dataViews.push({name: 'Currently Used Data',
                                            isTitle: true, term: term});
                                        dataViews = dataViews.concat(curData);
                                    }
                                    var newData = _.map(_.reject(results.views, function(v)
                                            { return !$.isBlank($.dataContext.availableContexts[v.id]); }),
                                        function(v) { return $.extend({isServer: true}, translateDS(v)); });
                                    if (!_.isEmpty(newData))
                                    {
                                        if (!_.isEmpty(dataViews))
                                        {
                                            dataViews.push({name: 'Unused Data', isTitle: true,
                                                isServer: true, term: term});
                                        }
                                        dataViews = dataViews.concat(newData);
                                    }
                                    dataCallback(dataViews);
                                });
                        }, 500);
                }
            },
            onComplete: function(data)
            { $textInput.data('fullData', data).change(); },
            valueFunction: function(dataItem)
            { return dataItem.id || null; }
        });
    });

    return true;
};

var pickerValue = function($field)
{
    var $editor = $field.find('input[type=hidden]');
    if ($editor.length < 1) { return null; }

    return $editor.value();
};

var pickerValidate = function($field)
{
    var $editor = $field.find('input[type=hidden]');
    if ($editor.length < 1) { return false; }

    return $editor.valid();
};

})(jQuery);
