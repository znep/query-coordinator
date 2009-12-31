class Column < Model
  cattr_reader :types

  @@types = { 
      "text" => "Plain Text", 
      "richtext" => "Formatted Text",
      "number" => "Number",
      "money" => "Money",
      "percent" => "Percent",
      "date" => "Date & Time",
      "phone" => "Phone",
      "email" => "Email",
      "url" => "Website URL",
      "checkbox" => "Checkbox",
      "stars" => "Star",
      "flag" => "Flag",
      "document" => "Document",
      "photo" => "Photo (Image)",
      "picklist" => "Multiple Choice",
      "drop_down_list" => "Multiple Choice",
      "nested_table" => "Nested Table",
      "tag" => "Row Tag"
  };

  def self.create(view_id, attributes, parent_id=nil)
    if parent_id.nil?
      path = "/views/#{view_id}/#{self.name.pluralize.downcase}.json"
    else
      path = "/views/#{view_id}/#{self.name.pluralize.downcase}/#{parent_id}/sub_columns"
    end

    attributes = Column.to_core(attributes)

    if attributes[:originalDataTypeName] == "nested_table"
      attributes["childColumns"] = [
          Column.to_core({"type" => "text", "width" => 100,"name" => "Untitled"})
      ]
    end

    return parse(CoreServer::Base.connection.create_request(path, attributes.to_json))
  end

  def is_sortable?
    return client_type != "nested_table" && 
      client_type != "tag" &&
      client_type != "photo" &&
      client_type != "document"
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

    case dataTypeName.downcase
    when "nested_table"
      aggs.reject! {|a| a['name'] != 'none'}
    when "text", "photo", "phone", "checkbox", "flag", "url",
      "email", "document", "tag", "picklist", "drop_down_list"
      aggs.reject! {|a|
        ['average', 'sum', 'maximum', 'minimum'].any? {|n| n == a['name']}}
    when "date"
      aggs.reject! {|a| ['average', 'sum'].any? {|n| n == a['name']}}
    when "stars"
      aggs.reject! {|a| 'sum' == a['name']}
    end

    aggs
  end

  def convertable_types
    if client_type == "text"
      return [
        "richtext", "number", "money", "percent", "date", "phone",
        "email", "url", "checkbox", "stars", "flag"
      ]
    elsif client_type == "richtext"
      return [
        "text", "number", "money", "percent", "date", "phone",
        "email", "url", "checkbox", "stars", "flag"
      ]
    end

    if ["percent", "money", "number", "stars"].include?(dataTypeName)
      return [
        "text", "number", "money", "percent", "stars"
      ].reject { |i| i == dataTypeName }
    end

    if ["date", "phone", "email", "url", "checkbox", "flag"].include?(dataTypeName)
      return ["text"]
    end

    return []
  end

  def has_display_options?
    types_with_display_options = ["text", "date", "number", "money", "percent"]

    return types_with_display_options.include?(client_type)
  end

  def has_formatting?
    types_with_formatting = ["text", "date", "number",
        "money", "percent", "phone", "email",
        "url", "checkbox", "stars", "flag", "picklist", "drop_down_list"]

    return types_with_formatting.include?(client_type)
  end

  def has_totals?
    types_with_totals = ["text", "richtext", "number", "money", "percent",
                         "date", "phone", "email", "url", "checkbox", "stars",
                         "flag", "document", "photo", "picklist",
                         "drop_down_list", "tag"]

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

    if js.key?("type") && js["type"] == "richtext" && client_type == "text"
      update_data[:format]["formatting_option"] = "Rich"
    elsif js.key?("type") && js["type"] == "text" && client_type == "richtext"
      update_data[:format].delete "formatting_option"
    end
  end

  def self.to_core(js)
    col = {
      :name => js["name"],
      :description => js["description"],
      :width => js["width"],
      :originalDataTypeName => js["type"],
      :dropDownList => js['dropDownList']
    }

    if js["type"] == "richtext"
      col[:originalDataTypeName] = "text"
      col[:format] ||= {}
      col[:format]["formatting_option"] = "Rich"
    end

    return col
  end

  # Convert the core server column data to what JS expects as a model so the
  # JS doesn't have to do it itself.
  def to_js
    col = {
      :name => CGI.escapeHTML(name),
      :description => CGI.escapeHTML(description),
      :width => width || 100,
      :type => dataTypeName || "text",
      :id => id
    }

    if aggregate != 'none'
      col['aggregate'] = {:type => aggregate}
    end

    if !self.format.nil?
      col[:type] = client_type
      col[:format] = self.format.view

      if !self.format.range.nil?
        col[:range] = self.format.range
      end

      if !self.format.precision.nil?
        col[:decimalPlaces] = self.format.precision
      end

      col[:alignment] = alignment unless aligment.nil?
    end

    return col.to_json.html_safe!
  end

  def client_type
    if !self.format.nil?
      if dataTypeName == "text" && self.format.formatting_option == "Rich"
        return "richtext"
      elsif dataTypeName == "stars" && self.format.view == "stars_number"
        return "number"
      end
    end

    return dataTypeName
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

  def is_nested_table
    dataTypeName.downcase == 'nested_table'
  end

  def is_list
    if is_nested_table
      return !self.format.nil? && self.format.isList
    end
    false
  end
end
