class Column < Model
  cattr_reader :types
  attr_accessor :data_position

  @@types = {
      "text" => "Plain Text",
      "html" => "Formatted Text",
      "number" => "Number",
      "money" => "Money",
      "percent" => "Percent",
      'calendar_date' => 'Date & Time',
      "date" => "Date & Time (with timezone)",
      "phone" => "Phone",
      "email" => "Email",
      "url" => "Website URL",
      "checkbox" => "Checkbox",
      "stars" => "Star",
      "flag" => "Flag",
      "document" => "Document",
      "photo" => "Photo (Image)",
      "document_obsolete" => "Document (old)",
      "photo_obsolete" => "Photo (Image, old)",
      "picklist" => "Multiple Choice",
      "drop_down_list" => "Multiple Choice",
      "nested_table" => "Nested Table",
      'location' => 'Location'
  }

  @@importable_types = Hash[ [ 'text', 'html', 'email', 'url',
                               'number', 'money', 'percent',
                               'calendar_date', 'date', 'checkbox',
                               'stars', 'location' ].
    collect { |type| [ type, I18n.t("core.data_types.#{type}") ] } ]

  @@legacy_types = [ 'html', 'email', 'url', 'date', 'stars' ]

  def self.importable_types(request = nil)
    @@importable_types.reject do |k, v|
      @@legacy_types.include?(k) if FeatureFlags.derive(nil, request).default_imports_to_nbe
    end
  end

  def self.create(view_id, attributes, parent_id=nil)
    if parent_id.nil?
      path = "/views/#{view_id}/#{self.name.pluralize.downcase}.json"
    else
      path = "/views/#{view_id}/#{self.name.pluralize.downcase}/#{parent_id}/sub_columns"
    end

    attributes = Column.to_core(attributes)

    if attributes[:dataTypeName] == "nested_table"
      attributes["childColumns"] = [
          Column.to_core({"type" => "text", "width" => 100,"name" => "Untitled"})
      ]
    end

    return parse(CoreServer::Base.connection.create_request(path, attributes.to_json))
  end

  def render_type
    @render_type ||= RenderType.new(renderTypeName)
  end

  def is_sortable?
    return client_type != "nested_table" &&
      client_type != "photo_obsolete" &&
      client_type != "document_obsolete" &&
      client_type != "photo" &&
      client_type != "document" &&
      client_type != 'location'
  end

  def form_enabled?
    return client_type != 'meta_data' &&
      client_type != 'nested_table' && !flag?('hidden')
  end

  def possible_filter_conditions
    filter_type =
      case dataTypeName
      when 'text', 'html', 'url', 'email', 'phone'
        'textual'
      when 'number', 'money', 'percent', 'stars', 'picklist', 'drop_down_list'
        'numeric'
      when 'photo_obsolete', 'photo', 'document_obsolete', 'document'
        'blob'
      when 'checkbox', 'flag', 'location'
        'comparable'
      when 'calendar_date', 'date'
        'date'
      else
        dataTypeName
      end

    return @@filter_conditions[filter_type]
  end

  def possible_aggregates
    aggs = [
      {'title' => 'None', 'name' => 'none'},
      {'title' => 'Average', 'name' => 'average'},
      {'title' => 'Count', 'name' => 'count'},
      {'title' => 'Sum', 'name' => 'sum'},
      {'title' => 'Maximum', 'name' => 'maximum'},
      {'title' => 'Minimum', 'name' => 'minimum'}
    ]

    case (dataTypeName || renderTypeName).downcase
    when "nested_table"
      aggs.reject! {|a| a['name'] != 'none'}
    when "text", 'html', "photo_obsolete", "photo", "phone", "checkbox",
      "flag", "url", "email", "document_obsolete", "document", "picklist",
      "drop_down_list", 'location'
      aggs.reject! {|a|
        ['average', 'sum', 'maximum', 'minimum'].any? {|n| n == a['name']}}
    when 'calendar_date', "date"
      aggs.reject! {|a|
        ['average', 'sum', 'maximum', 'minimum'].any? {|n| n == a['name']}}
    when "stars"
      aggs.reject! {|a| 'sum' == a['name']}
    end

    aggs
  end

  def convertable_types
    return [] if is_group_aggregate?

    if client_type(dataTypeName) == "text"
      return [
        'html', "number", "money", "percent", 'calendar_date', "date", "phone",
        "email", "url", "checkbox", "stars", "flag"
      ]
    elsif client_type(dataTypeName) == "html"
      return [
        'text', "number", "money", "percent", 'calendar_date', "date", "phone",
        "email", "url", "checkbox", "stars", "flag"
      ]
    end

    if ["percent", "money", "number", "stars"].include?(dataTypeName)
      return [
        "text", "number", "money", "percent", "stars"
      ].reject { |i| i == dataTypeName }
    end

    if dataTypeName == 'calendar_date'
      return ['text', 'date']
    end
    if dataTypeName == 'date'
      return ['text', 'calendar_date']
    end

    if ["phone", "email", "url", "checkbox", "flag"].include?(dataTypeName)
      return ["text"]
    end

    return []
  end

  def has_display_options?
    return false if is_group_aggregate? && dataTypeName != 'number'

    types_with_display_options = ['calendar_date', "date", "number", "money",
      "percent"]

    return types_with_display_options.include?(client_type)
  end

  def has_formatting?
    types_with_formatting = ["text", 'calendar_date', "date", "number",
        "money", "percent", "phone", "email", 'location',
        "url", "checkbox", "stars", "flag", "picklist", "drop_down_list"]

    return types_with_formatting.include?(client_type)
  end

  def has_totals?
    types_with_totals = ["text", 'html', "number", "money", "percent",
                         'calendar_date', "date", "phone", "email", "url",
                         "checkbox", "stars", "flag", "document_obsolete",
                         "document", "photo_obsolete", "photo", "picklist",
                         "drop_down_list", 'location']

    return types_with_totals.include?(client_type)
  end

  def convert_href(view_id)
    "/views/#{view_id}/columns/#{id}.json?method=convert"
  end

  def href(view_id)
    "/datasets/#{view_id}/columns/#{id}"
  end

  def self.find(view_id, column_id=nil)
    path = "/views/#{view_id}/#{self.name.pluralize.downcase}"

    if column_id.nil?
      path += ".json"
    else
      path += "/#{column_id}.json"
    end

    parse(CoreServer::Base.connection.get_request(path))
  end

  def save!(view_id)
    attributes = update_data.clone
    attributes.each do |key, value|
      if value.blank? || value == '""' ||
        value == "''" || value == "null"
        attributes[key] = nil
      end
    end
    path = "/views/#{view_id}/#{self.class.name.pluralize.downcase}/#{id}.json"
    Column.parse(CoreServer::Base.connection.update_request(path, attributes.to_json))
  end

  def update(js)
    update_data[:name] = js["name"] if js.key?("name")
    update_data[:description] = js["description"] if js.key?("description")
    update_data[:width] = js["width"] if js.key?("width")

    update_data[:dropDownList] = js["dropDownList"] if js.key?("dropDownList")

    update_data[:format] = self.format.nil? ? {} : self.format.data.clone
    if js.key?("aggregate") && js["aggregate"].blank?
      update_data[:format].delete "aggregate"
    elsif js.key?("aggregate")
      update_data[:format]["aggregate"] = js["aggregate"]["type"]
    end

    if js.key?("alignment") && js["alignment"].blank?
      update_data[:format].delete "align"
    elsif js.key?("alignment")
      update_data[:format]["align"] = js["alignment"]
    end

    if js.key?("format") && js["format"].blank?
      update_data[:format].delete "view"
    elsif js.key?("format")
      update_data[:format]["view"] = js["format"]
    end

    if js.key?("decimalPlaces") && js["decimalPlaces"].blank?
      update_data[:format].delete "precision"
    elsif js.key?("decimalPlaces")
      update_data[:format]["precision"] = js["decimalPlaces"].to_i
    end

    if js.key?("precisionStyle") && js["precisionStyle"].blank?
      update_data[:format].delete "precisionStyle"
    elsif js.key?("precisionStyle")
      update_data[:format]["precisionStyle"] = js["precisionStyle"]
    end

    if js.key?("currency") && js["currency"].blank?
      update_data[:format].delete "currency"
    elsif js.key?("currency")
      update_data[:format]["currency"] = js["currency"]
    end

    if js.key?("humane")
      update_data[:format]["humane"] = js["humane"]
    end

    if js.key?("rdf") && (js["rdf"].blank? || js["rdf"] == "_")
      update_data[:format].delete "rdf"
    elsif js.key?("rdf")
      update_data[:format]["rdf"] = js["rdf"]
    end

  end

  def to_core
    c = data.deep_merge(update_data).with_indifferent_access
    c['childColumns'] = childColumns.map {|cc| cc.is_a?(Column) ? cc.to_core : cc} if childColumns
    Column.to_core(c)
  end

  def self.to_core(js)
    col = {}
    [:id, :name, :fieldName, :position, :description, :width, :dropDownList, :dropDown, :dataTypeName,
      :renderTypeName, :defaultValues, :metadata, :tableColumnId, :cachedContents, :childColumns].each do |k|
      col[k] = js[k.to_s] if !js[k.to_s].blank?
    end
    col[:format] = js['format']
    col[:flags] = js['flags']
    col[:dataTypeName] = js['type'] if !js['type'].blank?

    return col
  end

  def as_json(opts = nil)
    to_core
  end

  # Convert the core server column data to what JS expects as a model so the
  # JS doesn't have to do it itself.
  def to_js
    col = self.data.clone
    col['name'] = CGI.escapeHTML(self.name)
    col['description'] = CGI.escapeHTML(self.description || '')
    col['format'] ||= {}

    return col.to_json.html_safe
  end

  def viewable_children
    if @view_children.nil?
      if childColumns
        @view_children = childColumns.each_with_index {|c, i| c.data_position = i}.
          select {|c| !c.flag?('hidden') && c.dataTypeName != 'meta_data'}.
          sort_by {|c| c.position}
      else
        @view_children = []
      end
    end
    return @view_children
  end

  def client_type(type = nil)
    if type.nil?
      type = renderTypeName
    end

    if !self.format.nil?
      if type == "stars" && self.format.view == "stars_number"
        return "number"
      end
    end

    return type
  end

  def sub_type_index(sub_type)
    return self.subColumnTypes.nil? ? nil : self.subColumnTypes.index(sub_type)
  end

  def text_format
    (self.format.nil? || self.format.formatting_option.nil?) ? 'Plain' :
      self.format.formatting_option
  end

  def aggregate
    (self.format.nil? || self.format.aggregate.nil?) ? 'none' :
      self.format.aggregate
  end

  def alignment
    if (!self.format.nil? && !self.format.align.nil?)
      return self.format.align
    end

    return nil
  end

  def format_view
    return (self.format.nil? || self.format.view.nil?) ? nil : self.format.view
  end

  def precision
    return (self.format.nil? || self.format.precision.nil?) ?
      nil : self.format.precision
  end

  def precision_style
    return (self.format.nil? || self.format.precisionStyle.nil?) ?
      'standard' : self.format.precisionStyle
  end

  def currency_symbol
    require 'money'
    currency = (self.format.nil? || self.format.currency.nil?) ?
      'USD' : self.format.currency

    return Money::Currency::TABLE[currency.downcase.to_sym][:html_entity]
  end

  def is_nested_table
    dataTypeName.downcase == 'nested_table'
  end

  def is_list
    if is_nested_table
      return !self.format.nil? && self.format.isList
    end
    false
  end

  def is_grouped?(view)
    !view.query.nil? && !view.query.groupBys.nil? &&
      view.query.groupBys.any? {|g| g['columnId'] == self.id}
  end

  def is_group_aggregate?
    !self.format.nil? && !self.format.grouping_aggregate.nil?
  end

  def is_linked?
    !(self.format.nil? || self.format.linkedKey.nil?)
  end

  private

  @@filter_conditions = {
      'textual' => [ { :operator => "EQUALS", :label => "equals" },
        { :operator => "NOT_EQUALS", :label => "does not equal" },
        { :operator => "STARTS_WITH", :label => "starts with" },
        { :operator => "CONTAINS", :label => "contains" } ],
      'date' => [ { :operator => "EQUALS", :label => "on" },
        { :operator => "NOT_EQUALS", :label => "not on" },
        { :operator => "LESS_THAN", :label => "before" },
        { :operator => "GREATER_THAN", :label => "after" } ],
#TODO: ruh roh: { :operator => "BETWEEN", :label => "between" } ],
      'comparable' => [ { :operator => "EQUALS", :label => "equals" } ],
      'blob' => [ { :operator => "IS_BLANK", :label => "is empty" },
        { :operator => "IS_NOT_BLANK", :label => "exists" } ],
      'numeric' => [ { :operator => "EQUALS", :label => "equals" },
        { :operator => "NOT_EQUALS", :label => "not equals" },
        { :operator => "LESS_THAN", :label => "less than" },
        { :operator => "LESS_THAN_OR_EQUALS", :label => "less than or equal to" },
        { :operator => "GREATER_THAN", :label => "greater than" },
        { :operator => "GREATER_THAN_OR_EQUALS", :label => "greater than or equal to" } ]
#TODO: ruh roh: { :operator => "BETWEEN", :label => "between"} ]
  }

end
