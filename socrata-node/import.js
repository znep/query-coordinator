(function() {
    var mime = require('mime');
    var rest = require('restler');

    var util = require(__dirname + '/blist-util');
    var ServerModel = require(__dirname + '/server-model');
    var Dataset = require(__dirname + '/dataset');

    var server = new ServerModel();

    var Import = {
        scan: function(filename, success)
        {
            util.makeRequest({
                url: '/api/imports2.txt?method=scan',
                method: 'post',
                multipart: true,
                data: {
                    file: rest.file(filename, filename, null, null, mime.lookup(filename))
                },
                success: function(result)
                {
                    success(new ImportTicket(result, filename));
                }
            });
        },

        types: {
            number: 'number',
            money: 'money',
            percent: 'percent',
            date: 'date',
            calendar_date: 'calendar_date',
            checkbox: 'checkbox',
            email: 'email',
            url: 'url',
            location: 'location'
        }
    };

    var ImportTicket = function(data, filename)
    {
        this.name = filename;
        this.fileId = data.fileId;
        this.sample = data.summary.sample;

        this.blueprint = new Blueprint(data.summary, filename);

        // we'll wipe it out later if it hasn't been touched
        this.translation = this.blueprint.columns.map(function(_, i) { return 'col' + (i + 1); });
    };

    ImportTicket.prototype = {
        // only works well if you haven't already fucked with the columns!
        addLocations: function()
        {
            this.locations.forEach(function(loc)
            {
                var translation = [ loc.address, loc.city, loc.state, loc.zip ]
                                    .filter(function(v) { return !!v; }) // compact
                                    .map(function(_, i) { return 'col' + (i + 1); })
                                    .join(' + ", " + ');
                if (loc.latitude && loc.longitude)
                {
                    if (translation) result += ' + ';
                    translation += '"(" + col' + (loc.latitude + 1) + ' + "," + ' + (loc.longitude + 1) + ' + ")"';
                }
                this.translation.push(translation);

                var nonCollidingName = 1;
                while (this.blueprint.columns.some(function(col) { return col.name == 'Location ' + nonCollidingName; }))
                    nonCollidingName++;
                nonCollidingName = 'Location ' + nonCollidingName;

                this.blueprint.columns.push({
                    name: nonCollidingName,
                    datatype: 'location'
                });
            });
        },

        import: function(success)
        {
            this._doImport('/api/imports2.json', { blueprint: JSON.stringify(this.blueprint.cleanCopy()) }, success);
        },

        append: function(ds, skip, success)
        {
            var uid = ds; // by default assume it's the uid?
            if (ds instanceof Dataset)
                uid = ds.id;

            this._doImport('/api/imports2.json?method=append', { viewUid: uid, skip: (skip || 0) }, success);
        },

        replace: function(ds, skip, success)
        {
            var uid = ds; // by default assume it's the uid?
            if (ds instanceof Dataset)
                uid = ds.id;

            this._doImport('/api/imports2.json?method=replace', { viewUid: uid, skip: (skip || 0) }, success);
        },

        _doImport: function(url, data, success)
        {
            data = data || {};
            util.extend(data, {
                name: this.name,
                fileId: this.fileId
            });

            var i = 1;
            if (!this.translation.some(function(part) { return part == ('col' + i++); }))
                data.translation = '[' + this.translation.join(',') + ']';

            server.makeRequest({
                url: url,
                method: 'post',
                data: data,
                progress: function(result)
                {
                    console.log('Imported ' + details.progress + ' rows...');
                },
                success: function(result)
                {
                    success(new Dataset(result));
                }
            });
        }
    };

    var Blueprint = function(summary, filename)
    {
        this.name = filename;
        this.skip = summary.headers + 1;
        this.columns = (summary.columns || []).map(function(col)
        {
            return {
                name: col.name,
                datatype: col.suggestion,
                analysis: {
                    datatype: col.suggestion,
                    processed: col.processed,
                    types: col.types
                }
            };
        });
        this.locations = summary.locations || [];
    };

    Blueprint.prototype = {
        cleanCopy: function()
        {
            return {
              name: this.name,
              skip: this.skip,
              columns: this.columns.map(function(col)
                  {
                      return {
                          name: col.name,
                          datatype: col.datatype
                      };
                  })
            };
        }
    };

    module.exports = Import;
})();

