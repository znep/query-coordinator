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
      "picklist" => "Picklist (Drop-down)",
      "nested_table" => "Nested Table",
      "tag" => "Row Tag"
  };
  
  def has_formatting?
    types_with_formatting = ["date", "number", "money", "percent"]

    return types_with_formatting.include?(client_type)
  end

  def has_totals?
    types_with_totals = ["text", "richtext", "number", "money", "percent", 
                         "date", "phone", "email", "url", "checkbox", "stars", 
                         "flag", "document", "photo", "picklist"]
    
    return types_with_totals.include?(client_type)
  end

  def href(view_id)
    "/blists/#{view_id}/columns/#{id}"
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
    parse(CoreServer::Base.connection.update_request(path, JSON.generate(attributes)))
  end

  def update(js)
    update_data[:name] = js["name"] if js.key?("name")
    update_data[:description] = js["description"] if js.key?("description")
    update_data[:width] = js["width"] if js.key?("width")

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
  end

  # Convert the core server column data to what JS expects as a model so the
  # JS doesn't have to do it itself.
  def to_js
    col = {
      :name => name,
      :description => description,
      :width => width || 100,
      :type => dataType && dataType.type ? dataType.type : "text",
      :id => id,
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

    return col.to_json
  end

  def client_type
    if !self.format.nil?
      if dataType.type == "text" && self.format.formatting_option == "Rich"
        return "richtext"
      elsif dataType.type == "stars" && self.format.view == "stars_number"
        return "number"
      end
    end

    return dataType.type
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
    dataType.type.downcase == 'nested_table'
  end

  def is_list
    if is_nested_table
      return !self.format.nil? && self.format.isList
    end
    false
  end
end
