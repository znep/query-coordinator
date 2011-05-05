module Canvas
  class CanvasWidget
    def initialize(data, id_prefix = '')
      @data = data
      @elem_id = "#{id_prefix}_#{self.class.name.split(/::/).last}"

      @properties = self.default_properties.deep_merge!(@data.properties || {})
    end

    def elem_id
      return @elem_id
    end

    def stylesheet
      result = self.style_definition.reduce('') do |str, definition|
        property_value = self.find_property(definition[:data])
        property_value = "#{property_value[:value]}#{property_value[:unit]}" if definition[:hasUnit]

        # commas
        str + "##{@elem_id} #{definition[:selector]} {#{definition[:css]}: #{property_value}}\n"
      end

      result += self.children.map{ |child| child.stylesheet }.join if self.has_children?
      return result
    end

    def style_definition
      return self.style_definition.to_json
    end

    def content_definition
      return self.content_definition.to_json
    end

    def has_children?
      return @data.children.is_a? Array
    end

    def children
      return nil unless self.has_children?
      return @children ||= CanvasWidget.from_config(@data.children, @elem_id)
    end

    def method_missing(key, *args)
      return @data[key]
    end

    def self.from_config(config, id_prefix = '')
      if config.is_a? Array
        i = 0
        return config.map do |config_item|
          i += 1
          CanvasWidget.from_config(config_item, id_prefix + i.to_s)
        end
      else
        # eg 'two_column_layout' ==> 'TwoColumnLayout'
        klass_name = config.type.gsub(/^(.)|(_.)/){ |str| str[-1].upcase }
        begin
          return Canvas.const_get(klass_name).new(config, id_prefix)
        rescue NameError => ex
          return nil
        end
      end
    end

  protected
    class_inheritable_accessor :default_properties, :style_definition, :content_definition

    def find_property(key)
      current = @properties

      # use all? here, so we just keep going until we hit a dead end, or we finish
      key.split(/\./).all?{ |subkey| current = current[subkey] }

      throw ">>> set a default for #{key} on #{self.class}! <<<" if current.nil?
      return current
    end

    self.default_properties = {}
    self.style_definition = []
    self.content_definition = []
  end

  class TwoColumnLayout < CanvasWidget
  protected
    self.default_properties = {
      contentPadding: { value: 1, unit: 'em' },
      leftColumnWidth: { value: 50, unit: '%' },
      rightColumnWidth: { value: 50, unit: '%' }
    }
    self.style_definition = [
      { data: 'contentPadding', selector: '.wrapper', css: 'padding', hasUnit: true },
      { data: 'leftColumnWidth', selector: '.leftColumn', css: 'width', hasUnit: true },
      { data: 'rightColumnWidth', selector: '.rightColumn', css: 'width', hasUnit: true }
    ]
  end

  class Catalog < CanvasWidget
  end

  class Html < CanvasWidget
    # nothing to do here. html is just html!
  end
end