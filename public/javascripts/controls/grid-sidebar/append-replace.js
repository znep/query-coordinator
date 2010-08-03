(function($)
{
    var baseConfig =
    {
        priority: 5,
        onlyIf: function(view)
        {
            return _.all(view.columns, function(c)
                {
                    return !_.include(['document', 'document_obsolete', 'tag',
                        'photo', 'photo_obsolete', 'nested_table'],
                        c.dataTypeName) || _.include(c.flags || [], 'hidden');
                }) && blist.dataset.valid && !blist.display.isTempView;
        },
        disabledSubtitle: function()
        {
            return !blist.dataset.valid || blist.display.isTempView ?
                'This view must be valid and saved' :
                'You cannot upload data into a dataset that contains a photo, ' +
                'document, nested table, or tags column. ' +
                'Please remove or hide such columns and try again, or ' +
                'import this data as a new file.';
        },
        sections: [
            {
                title: 'Select File',
                fields: [
                    {text: 'File', type: 'file', name: 'uploadFile', required: true,
                    fileTypes: ['CSV', 'TSV', 'XML', 'XLS', 'XLSX'],
                    wizard: 'Choose a file to upload. For best results, ' +
                        'the data file you select should have the same ' +
                        'columns in the same order as the current dataset'},
                    {text: 'Skip Header', type: 'checkbox', name: 'skipHeader',
                    wizard: 'Choose if you want header rows to be automatically ' +
                        'detected and skipped, just like during import'}
                ]
            }
        ],
        finishBlock: {
            buttons: [{text: 'Upload', isDefault: true, value: true},
                $.gridSidebar.buttons.cancel],
            wizard: "Now you're ready to upload new data to your dataset"
        }
    };

    baseConfig.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }


        var vals = sidebarObj.getFormValues($pane);
        vals.uploadFile._settings.action = '/views/' + blist.display.view.id +
            '/rows.txt?method=' + data.uploadType +
            '&skip_headers=' + vals.skipHeader;
        vals.uploadFile._settings.onComplete = function(file, response)
        {
            sidebarObj.finishProcessing();
            if (response.error)
            {
                $pane.find('.mainError').text(response.message);
            }
            else
            {
                sidebarObj.$grid().blistModel().reloadView();
                sidebarObj.$dom().socrataAlert(
                        {message: 'Your dataset has been updated', overlay: true});
                sidebarObj.hide();
            }
        };
        vals.uploadFile.submit();
    };


    if ($.isBlank(blist.sidebarHidden.edit) ||
        !blist.sidebarHidden.edit.append)
    {
        var appendConfig = $.extend(true, {}, baseConfig);
        appendConfig.name = 'edit.append';
        appendConfig.title = 'Append';
        appendConfig.dataSource = {uploadType: 'append'};
        appendConfig.subtitle = 'Upload more data from a file that will be added ' +
            'to the current dataset';

        $.gridSidebar.registerConfig(appendConfig);
    }


    if ($.isBlank(blist.sidebarHidden.edit) ||
        !blist.sidebarHidden.edit.replace)
    {
        var replaceConfig = $.extend(true, {}, baseConfig);
        replaceConfig.name = 'edit.replace';
        replaceConfig.title = 'Replace';
        replaceConfig.priority = 6;
        replaceConfig.dataSource = {uploadType: 'replace'};
        replaceConfig.subtitle = 'Upload a file that will replace all of the ' +
            'rows in the current dataset (the original data will be lost).';

        $.gridSidebar.registerConfig(replaceConfig);
    }

})(jQuery);
