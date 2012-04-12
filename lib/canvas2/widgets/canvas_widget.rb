module Canvas2
  class CanvasWidget
    attr_accessor :id, :parent

    def initialize(props, parent = nil, resolver_context = nil)
      @properties = props
      @resolver_context = resolver_context
      @properties['id'] ||= Canvas2::Util.allocate_id
      self.id = @properties['id']
      self.parent = parent

      if @properties.has_key?('context')
        c_id = 'context-' + self.id
        DataContext.load_context(c_id, string_substitute(@properties['context']))
        @context = DataContext.available_contexts[c_id]
      end
    end

    def properties
      return @properties
    end

    def resolver_context
      return @resolver_context
    end

    def context
      if @properties.has_key?('contextId') && @context.blank?
        if @properties['contextId'].is_a?(Array)
          @context = []
          @properties['contextId'].each {|cId| @context << get_context(cId)}
        else
          @context = get_context(@properties['contextId'])
        end
      end
      @context
    end

    def get_context(cId)
      DataContext.available_contexts[cId] || (@properties['entity'] || {})[cId]
    end

    def string_substitute(text, special_resolver = nil)
      Util.string_substitute(text, special_resolver || resolver)
    end

    def eval_if(if_value)
      [if_value].flatten.all? do |v|
        r = !string_substitute('{' + (v['key'] || v) + ' ||}').blank?
        r = !r if v['negate']
        r
      end
    end

    def render
      c, fully_rendered = render_contents
      html_class = render_classes + ' ' +
        string_substitute(@properties['htmlClass'].is_a?(Array) ?
                          @properties['htmlClass'].join(' ') : @properties['htmlClass'])
      is_hidden = @properties['hidden'] || @properties['requiresContext'] && context.blank? ||
        @properties['ifValue'] && !eval_if(@properties['ifValue'])
      t = '<div class="socrata-component component-' + @properties['type'] + ' ' +
        (is_hidden ? ' hide' : '') + (@properties['customClass'] || '') +
        (@needs_own_context ? '' : (' ' + html_class)) + (fully_rendered ? ' serverRendered' : '') +
        '" id="' + self.id + '">'
      t += '<div class="content-wrapper ' + html_class + '">' if @needs_own_context
      t += c
      t += '</div>' if @needs_own_context
      [t += '</div>', fully_rendered]
    end

    def render_contents
      ['', false]
    end

    def render_classes
      ''
    end

    def resolver
      parent_resolver = !self.parent.blank? ? self.parent.resolver() : Util.base_resolver()
      lambda do |name|
        v = Util.deep_get((@resolver_context || {}), name)
        c = context || {}
        if c.is_a?(Array)
          c = {}
          context.each {|dc| c[dc.id] = dc}
        end
        v = Util.deep_get(c, name) if v.blank?
        v = parent_resolver.call(name) if v.blank?
        v
      end
    end

    def self.from_config(config, parent = nil, resolver_context = nil)
      if config.is_a? Array
        i = 0
        return config.map do |config_item|
            i += 1
            CanvasWidget.from_config(config_item, parent, resolver_context)
        end
      else
        begin
          return Canvas2.const_get(config['type']).new(config, parent, resolver_context)
        rescue NameError => ex
          throw "There is no Canvas2 widget of type '#{config['type']}'."
        end
      end
    end
  end
end
