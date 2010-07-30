(function(){

this.Dataset = Model.extend({
    _init: function (v)
    {
        this._super();

        $.extend(this, v);

        this.origDisplayType = this.displayType;

        this.displayType = getDisplayType(this);
        this.displayClass = this.displayType.capitalize();
        this.typeName = getTypeName(this);

        this.displayFormat = this.displayFormat || {};

        this.originalViewId = this.id;

        Dataset.addProperties(this, Dataset.modules[this.displayType] || {},
            Dataset.prototype);

        this._updateColumns();

        if (_.isFunction(this._convertLegacy)) { this._convertLegacy(); }

        this.isValid = this._checkValidity();
    },

    columnForID: function(id)
    {
        return _.detect(this.columns, function(c) { return c.id == id; });
    },

    columnForTCID: function(tcId)
    {
        return _.detect(this.columns, function(c)
                { return c.tableColumnId == tcId; });
    },

    isPublic: function()
    {
        return _.any(this.grants || [], function(grant)
        { return _.include(grant.flags || [], 'public'); });
    },

    _checkValidity: function()
    {
        return $.isBlank(this.message);
    },

    _updateColumns: function()
    {
        var ds = this;
        this.columns = _.map(this.columns, function(c, i)
            {
                c = new Column(c, ds);
                c.dataIndex = i;
                return c;
            });
        this.realColumns = _.reject(this.columns, function(c)
            { return c.dataTypeName == 'meta_data'; });
        this.visibleColumns = _(this.realColumns).chain()
            .reject(function(c) { return c.hidden; })
            .sortBy(function(c) { return c.position; })
            .value();
    }
});

Dataset.modules = {};

var VIZ_TYPES = ['chart', 'annotatedtimeline', 'imagesparkline',
    'areachart', 'barchart', 'columnchart', 'linechart', 'piechart'];
var MAP_TYPES = ['geomap', 'intensitymap'];

/* The display type string is not always the simplest thing -- a lot of munging
 * goes on in Rails; we roughly duplicate it here */
function getDisplayType(ds)
{
    var type = ds.displayType || 'blist';

    if (ds.viewType == 'blobby') { type = 'blob'; }
    if (ds.viewType == 'href') { type = 'href'; }

    if (!$.isBlank(ds.query) && !$.isBlank(ds.query.groupBys) &&
        ds.query.groupBys.length > 0)
    { type = 'grouped'; }

    if (_.include(VIZ_TYPES, type)) { type = 'visualization'; }

    if (_.include(MAP_TYPES, type)) { type = 'map'; }

    if (type == 'blist' && !_.include(ds.flags || [], 'default'))
    { type = 'filter'; }
    return type;
};

function getTypeName(ds)
{
    var retType = ds.displayType;

    switch (ds.displayType)
    {
        case 'blist':
            retType = 'dataset';
            break;
        case 'filter':
            retType = 'filtered view';
            break;
        case 'grouped':
            retType = 'grouped view';
            break;
        case 'visualization':
            retType = 'chart';
            break;
        case 'blob':
            retType = 'embedded file';
            break;
        case 'href':
            retType = 'linked dataset';
            break;
    }

    return retType;
};

function cleanViewForPost(ds, includeColumns)
{
    ds = $.extend(true, {}, ds);

    var cleanFuncs = function(val)
    {
        funcs = _(val).chain()
            .map(function(v, k) { return _.isFunction(v) ? k : null; })
            .compact()
            .value();
        _.each(funcs, function(f) { delete val[f]; });
    };

    cleanFuncs(ds);

    if (includeColumns)
    {
        ds.columns = ds.realColumns;
        var cleanColumn = function(col)
        {
            cleanFuncs(col);
            delete col.options;
            delete col.dropDown;
            delete col.hidden;
            delete col.dataType;
            delete col.renderType;
            delete col.renderTypeName;
            delete col.dataTypeName;
            delete col.view;
            delete col.parentColumn;
            delete col.realChildren;
            delete col.visibleChildren;
        };

        // Clean out dataIndexes, and clean out child metadata columns
        _.each(ds.columns, function(c)
        {
            cleanColumn(c);
            if (c.childColumns)
            {
                _.each(c.childColumns, function(cc) { cleanColumn(cc); });
            }
        });

        if (!$.isBlank((ds.query || {}).groupBys))
        {
            ds.columns = _.reject(ds.columns, function(c)
            {
                return $.isBlank((c.format || {}).grouping_aggregate) &&
                    !_.any(ds.query.groupBys, function(g)
                    { return g.columnId == c.id; });
            });
        }
    }
    else
    { delete ds.columns; }
    delete ds.visibleColumns;
    delete ds.realColumns;

    delete ds.origDisplayType;
    delete ds.displayClass;
    delete ds.typeName;
    delete ds.isValid;
    delete ds.totalRows;
    delete ds.grants;
    return ds;
};

function cleanViewForSave(ds, includeColumns)
{
    ds = cleanViewForPost(ds, includeColumns);

    if (!_.isUndefined(ds.metadata))
    { delete ds.metadata.facets; }

    return ds;
};

})();
