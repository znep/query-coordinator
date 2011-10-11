(function($)
{
    var skipHeader = {text: 'Skip Header', type: 'checkbox', name: 'skipHeader'};

    var baseConfig =
    {
        isAvailable: function()
        {
            var cpObj = this;
            return _.all(cpObj._view.visibleColumns || [], function(c)
                {
                    return !_.include(['document', 'document_obsolete',
                        'photo', 'photo_obsolete', 'nested_table'], c.dataTypeName);
                }) && cpObj._view.valid &&
                    (!cpObj._view.temporary || cpObj._view.minorChange);
        },

        getDisabledSubtitle: function()
        {
            return !this._view.valid ||
                (this._view.temporary && !this._view.minorChange) ?
                'This view must be valid and saved' :
                'You cannot upload data into a dataset that contains a photo, ' +
                'document, nested table, or tags column. ' +
                'Please remove or hide such columns and try again, or ' +
                'import this data as a new file.';
        },

        _getSections: function()
        {
            var mainSect =
            {
                title: 'Select File',
                fields: [
                    {text: 'File', type: 'file', name: 'uploadFile', required: true,
                    fileTypes: ['CSV', 'TSV', 'XML', 'XLS', 'XLSX']},
                    skipHeader
                ]
            };
            if (this._view.type == 'blob')
            {
                delete mainSect.fields[0].fileTypes;
                mainSect.fields.length = 1;
            }
            return [mainSect];
        },

        _getFinishButtons: function()
        { return [{text: 'Upload', isDefault: true, value: true}, $.controlPane.buttons.cancel]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(this, arguments)) { return; }

            // In theory, it would be nice to have append/replace functions on
            // Dataset.  However, that is kind of difficult since it requires doing
            // a form upload, which is tied rather tightly to the UI
            var vals = cpObj._getFormValues();
            if (cpObj._view.type == 'blob')
            { vals.uploadFile._settings.action = '/views/' + cpObj._view.id +
                '.txt?method=replaceBlob'; }
            else
            { vals.uploadFile._settings.action = '/views/' + cpObj._view.id +
                '/rows.txt?method=' + data.uploadType + '&skip_headers=' + vals.skipHeader; }
            vals.uploadFile._settings.onComplete = function(file, response)
            {
                cpObj._finishProcessing();
                if (response.error)
                { cpObj.$dom().find('.mainError').text(response.message); }
                else
                {
                    cpObj._showMessage('Your dataset has been updated');
                    cpObj._hide();
                    if (_.isFunction(finalCallback)) { finalCallback(); }
                    cpObj._view.reload();
                }
            };
            vals.uploadFile.submit();
        }
    };


    var appendConfig = $.extend(true, {}, baseConfig);
    appendConfig.getTitle = function() { return 'Append'; };
    appendConfig._getCurrentData = function()
    {
        var d = this._super();
        if (!$.isBlank(d)) { return d; }
        return {uploadType: 'append'};
    };
    appendConfig.getSubtitle = function() { return 'Upload more data from a file that will be added ' +
        'to the current dataset'; };

    $.Control.extend('pane_append', appendConfig, {name: 'append'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.append)
    { $.gridSidebar.registerConfig('edit.append', 'pane_append', 5); }


    var replaceConfig = $.extend(true, {}, baseConfig);
    replaceConfig.getTitle = function() { return 'Replace'; };
    replaceConfig._getCurrentData = function()
    {
        var d = this._super();
        if (!$.isBlank(d)) { return d; }
        return {uploadType: 'replace'};
    };
    replaceConfig.getSubtitle = function() { return 'Upload a file that will replace all of the ' +
        'rows in the current dataset (the original data will be lost).'; };

    $.Control.extend('pane_replace', replaceConfig, {name: 'replace'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.replace)
    { $.gridSidebar.registerConfig('edit.replace', 'pane_replace', 6); }

})(jQuery);
