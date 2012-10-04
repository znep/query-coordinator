module Canvas2
  class NoContentError < StandardError
  end

  class DataContextError < StandardError
    attr_reader :config, :error_message, :details

    def initialize(config, error_message, details = {})
      @config = config
      @error_message = error_message
      @details = details
      @details[:config] = config
    end

    def to_s
      "Data context '#{@config[:id]}' failed to load: #{@error_message}"
    end
  end

  class ComponentError < StandardError
    attr_reader :component, :error_message, :details

    def initialize(comp, error_message, details = nil)
      @component = comp
      @error_message = error_message
      @details = details
    end

    def to_s
      id = @component.is_a?(Hash) ? @component['id'] : @component.id
      if !@component.is_a?(Hash)
        c = @component.parent
        while !c.blank?
          id = c.id + ':' + id
          c = c.parent
        end
      end
      "Component '#{id}' failed to render: #{@error_message}"
    end
  end
end
