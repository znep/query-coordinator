;(function($) {
    var domainFields;

    $.Control.extend('pane_propertiesPalette', {
        _init: function()
        {
            this._super.apply(this, arguments);
            if ($('#templates > .propertiesPaletteContainer').length < 1)
            {
                $('#templates').append($.tag({ tagName: 'div', 'class': 'propertiesPaletteContainer',
                    contents: { tagName: 'span', 'class': 'cf-property', draggable: true } }));
            }
        },

        getTitle: function()
        { return 'Available Properties'; },

        isAvailable: function()
        { return !$.isBlank(this.component); },

        setComponent: function(newComp)
        {
            this.component = newComp;
            this.reset();
            this.render();
        },

        _getSections: function()
        {
            var prPal = this;
            var comp = prPal.component;

            var reRender = function()
            {
                prPal._finishProcessing();
                prPal.reset();
                prPal.render();
            };

            prPal._startProcessing();
            if (_.isUndefined(domainFields))
            {
                Configuration.findByType('metadata', null, function(conf)
                {
                    domainFields = {};
                    _.each(conf.properties.fieldsets, function(fs)
                    {
                        _.each(fs.fields, function(f)
                            { $.deepSet(domainFields, true, fs.name, f.name); });
                    });
                    reRender();
                });
                return null;
            }

            if (!comp._updateDataSource(null, reRender))
            {
                prPal._finishProcessing();
                if (_.isEmpty(comp._dataContext))
                {
                    return [{
                        fields: [{ type: 'note', value: 'No data set for this component' }]
                    }];
                }

                var r = _.map($.makeArray(comp._dataContext), function(dc)
                { return sectionConfig(prPal, comp, dc); });
                return r;
            }
            return null;
        }
     }, {name: 'propertiesPalette'}, 'controlPane');

    var sectionConfig = function(prPal, comp, dc)
    {
        var availProps = {};
        var addProperties = function(obj, key, prefix)
        {
            prefix = prefix || '';
            if (!$.isBlank(prefix) && !prefix.endsWith('.'))
            { prefix += '.'; }

            if (_.isFunction(obj) || key.startsWith('_'))
            { return; }

            var fullKey = prefix + key;
            if (_.isArray(obj))
            {
                key += '[]';
                _.each(obj, function(v) { addProperties(v, key, prefix); });
            }
            else if (obj instanceof Object)
            {
                _.each(obj, function(v, k)
                { addProperties(v, k, fullKey); });
            }
            else
            { availProps[fullKey] = { shortKey: key, fullKey: fullKey }; }
        };

        var addDatasetProperties = function(ds, prefix)
        {
            prefix = prefix || '';
            if (!$.isBlank(prefix) && !prefix.endsWith('.'))
            { prefix += '.'; }
            prefix += 'dataset';

            _.each(['name', 'description', 'id', 'tags', 'url'], function(key)
                    { addProperties($.deepGetStringField(ds, key), key, prefix) });
            _.each(['metadata.custom_fields'], function(key)
            {
                var obj = $.deepGetStringField(ds, key);
                if (!_.isEmpty(obj))
                { addProperties(obj, key, prefix); }
            });
        };

        switch (dc.type)
        {
            case 'datasetList':
                _.each(dc.datasetList, function(ds) { addDatasetProperties(ds, 'datasetList[]'); });
                addProperties(domainFields, 'custom_fields', 'datasetList[].dataset.metadata');
                break;
            case 'dataset':
                addDatasetProperties(dc.dataset);
                addProperties(domainFields, 'custom_fields', 'dataset.metadata');
                break;
            case 'row':
                addProperties(dc.row, 'row');
                break;
            case 'entity':
                addProperties(dc.value, 'value');
                break;
            default:
                break;
        }

        return { title: dc.id + ' (' + dc.type.displayable() + ')', type: 'selectable', name: dc.id,
            customContent: {
                template: 'propertiesPaletteContainer',
                directive: {
                    '.cf-property': {
                        'availProp<-properties': {
                            '.@title': 'availProp.fullKey!',
                            '.@data-dcid': 'dc.id!',
                            '.@data-propkey': 'availProp.fullKey!',
                            '.': 'availProp.shortKey!'
                        }
                    }
                },
                data: { dc: dc, properties:
                    _.map(_.sortBy(_.keys(availProps), function(k) { return availProps[k].shortKey; }),
                        function(k) { return availProps[k]; }) },
                callback: function($newSect, data)
                {
                    $newSect.find('.cf-property').quickEach(function()
                    {
                        var $t = $(this);
                        if ($.browser.msie)
                        {
                            $t.bind('selectstart', function(e)
                            {
                                e.preventDefault();
                                this.dragDrop();
                            });
                        }

                        $t.bind('dragstart', function(e)
                        {
                            $t.socrataTip().hide();
                            if (!$.browser.msie)
                            {
                                e.originalEvent.dataTransfer.setData('text/html',
                                    '<span data-droppednewproperty="' +
                                    $t.attr('data-propkey') + '"></span>');
                            }
                            // IE doesn't support setData('text/html',...), so don't
                            // get a real span dropped in; instead, we get raw text
                            // that is keyed such that it will be replaced by cf.Property
                            // This is also used by all browsers for replacing a property
                            e.originalEvent.dataTransfer.setData('Text',
                                $.cf.Property.newPropertyTag.begin + $t.attr('data-propkey') +
                                $.cf.Property.newPropertyTag.end);
                            // Chrome requires copy, or won't do anything on drop
                            e.originalEvent.dataTransfer.effectAllowed = 'copy';
                            // Fixes a bug in Chrome where the drag helper image had a bad offset;
                            // this also makes it a bit more obvious where the
                            // insertion cursor is during drag
                            if (!$.browser.msie)
                            { e.originalEvent.dataTransfer.setDragImage($t[0], 0, 0); }
                            else
                            { blist.util.startIEDrag($t); }
                        })
                        .bind('dragend', function()
                        { if ($.browser.msie) { blist.util.finishIEDrag(); } });
                    });
                }
            } };
    };
})(jQuery);
