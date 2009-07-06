class Column < Model
  cattr_reader :types

  @@types = { 
      "text" => "Plain Text", 
      "richText" => "Formatted Text",
      "number" => "Number",
      "money" => "Money",
      "percent" => "Percent",
      "dateTime" => "Date & Time",
      "phone" => "Phone",
      "email" => "Email",
      "url" => "Website URL",
      "checkbox" => "Checkbox",
      "stars" => "Star",
      "flag" => "Flag",
      "document" => "Document",
      "photo" => "Photo (Image)",
      "picklist" => "Picklist (Drop-down)",
      "nestedTable" => "Nested Table",
      "tag" => "Row Tag"
  };

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

    get_request(path)
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
    self.class.update_request(path, JSON.generate(attributes))
  end

  def update(js)
    update_data[:name] = js["name"] if js.key?("name")
    update_data[:description] = js["description"] if js.key?("description")
    update_data[:width] = js["width"] if js.key?("width")

    update_data[:format] = self.format.data.clone
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
    pp update_data[:format]
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
      col[:format] = self.format["view"]

      if !self.format["range"].nil?
        col[:range] = self.format["range"]
      end

      if !self.format["precision"].nil?
        col[:decimalPlaces] = self.format["precision"]
      end

      col[:alignment] = alignment unless aligment.nil?
    end

    return col.to_json
  end

  def client_type
    if !self.format.nil?
      if dataType.type == "text" && self.format["formatting_option"] == "Rich"
        "richtext"
      elsif dataType.type == "stars" && self.format["view"] == "stars_number"
        "number"
      end
    end

    dataType.type
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
    if !self.format.data["align"].nil?
      return self.format.data["align"]
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
