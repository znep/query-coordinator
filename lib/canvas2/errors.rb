module Canvas2
  class NoContentError < StandardError
    attr_reader :source_error

    def initialize(source = nil)
      @source_error = source
    end

    def display_message
      @source_error.nil? ? nil : @source_error.display_message
    end

    def code
      @source_error.nil? ? nil : @source_error.code
    end
  end

  class DataContextError < StandardError
    attr_reader :config, :error_message, :details, :display_message, :code

    def initialize(config, error_message, details = {}, display_message = nil, code = nil)
      @config = config
      @error_message = error_message
      @details = details
      @details[:config] = config
      @display_message = display_message || config['errorMessage']
      @code = code
    end

    def to_s
      "Data context '#{@config[:id]}' failed to load: #{@error_message}"
    end
  end

  class ComponentError < StandardError
    attr_reader :component, :error_message, :details, :display_message, :code

    def initialize(comp, error_message, details = nil, display_message = nil, code = nil)
      @component = comp
      @error_message = error_message
      @details = details
      @display_message = display_message
      @code = code
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
