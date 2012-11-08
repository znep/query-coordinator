module Canvas2
  class CanvasWidget
    attr_accessor :id, :parent, :server_properties
    attr_reader :properties, :resolver_context

    def initialize(props, parent = nil, resolver_context = nil)
      @properties = props
      @resolver_context = resolver_context
      @properties['id'] ||= Canvas2::Util.allocate_id
      self.server_properties = {}
      self.id = @properties['id']
      self.parent = parent
      @context_ids = []

      if @properties.has_key?('context')
        c_id = 'context-' + self.id
        con = string_substitute(@properties['context'])
        if con.is_a?(Array)
          @context = []
          con.each_with_index do |c,i|
            cur_id = c['id'].blank? ? c_id + '-' + i.to_s : c['id']
            DataContext.load_context(cur_id, c)
            @context << DataContext.available_contexts[cur_id]
            # Collect ids for later perusal
            @context_ids << cur_id
          end
          @context.compact!
        else
          c_id = con['id'].blank? ? c_id : con['id']
          DataContext.load_context(c_id, con)
          @context = DataContext.available_contexts[c_id]
          # Collect ids for later perusal
          @context_ids << c_id
        end
      end
    end

    def context
      if @context.blank? && !@properties.has_key?('context') # Have to handle a failed context
        if @properties.has_key?('contextId')
          @context = {temp: 1} # Set here so string_substitute doesn't cause an infinite loop
          cIds = string_substitute(@properties['contextId'])
          if cIds.is_a?(Array)
            @context = []
            cIds.each {|cId| @context << get_context(cId)}
            @context.compact!
          else
            @context = get_context(cIds)
          end
        elsif !self.parent.blank?
          @context = self.parent.child_context
        end
      end
      @context
    end

    def get_context(cId)
      @context_ids << cId
      DataContext.available_contexts[cId] || (@properties['entity'] || {}).with_indifferent_access[cId]
    end

    def string_substitute(text, special_resolver = nil)
      Util.string_substitute(text, special_resolver || resolver)
    end

    def is_hidden
      # Don't use this property because of 508
      #@properties['hidden'] ||
      @properties['requiresContext'] && (context.blank? || context.empty?) ||
        @properties['ifValue'] && !eval_if(@properties['ifValue'])
    end

    def eval_if(if_value)
      [if_value].flatten.all? do |v|
        r = !string_substitute('{' + (v['key'] || v) + ' ||}').blank?
        r = !r if v['negate']
        r
      end
    end

    def render
      start_time = Time.now
      begin
        contents, fully_rendered, child_timings = render_contents
      rescue CoreServer::CoreServerError => e
        raise ComponentError.new(self, "Data context '#{context[:id]}' failed: " + e.error_message,
                                 { path: e.source, payload: JSON.parse(e.payload) })
      end
      # Tell the DataContext that the contexts used by this widget should be available
      # on the client.
      if !fully_rendered 
         @context_ids.each do |cId| 
           DataContext.set_context_as_streaming(cId);
         end
      end
      html_class = render_classes + ' ' +
        string_substitute(@properties['htmlClass'].is_a?(Array) ?
                          @properties['htmlClass'].join(' ') : @properties['htmlClass'])

      classes = ['socrata-component', "component-#{@properties['type']}"]
      classes << 'hide' if is_hidden
      classes << @properties['customClass'] unless @properties['customClass'].blank?
      classes << html_class unless @needs_own_context
      classes << 'serverRendered' if fully_rendered

      styles = (server_properties['styles'] || {}).merge(@properties['styles'] || {}).
        map { |k, v| k + ':' + v.to_s + ';' }.join('')
      tag = ''

      tag << %Q(<div class="#{classes.join(' ')}" id="#{self.id}" style="#{styles}">)
      tag << '<div class="content-wrapper ' << html_class << '">' if @needs_own_context
      tag << contents
      tag << '</div>' if @needs_own_context
      child_timings ||= []
      child_timings.unshift("#{self.id} took #{(Time.now - start_time) * 1000} ms")
      [tag << '</div>', fully_rendered, child_timings.compact.join("\n " + self.id + " | ")]
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
        if !context.blank?
          keyed_c = {}
          context.is_a?(Array) ?
            context.each { |dc| keyed_c[dc[:id]] = dc } : (keyed_c[context[:id]] = context)
          v = Util.deep_get(keyed_c, name) if v.blank?
          v = Util.deep_get(context, name) if v.blank? && !context.is_a?(Array)
          v = context.detect { |c| Util.deep_get(c, name) } if v.blank? && context.is_a?(Array)
        end
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
          raise ComponentError.new(config, "There is no component of type #{config['type']}",
                                   { config: config })
        end
      end
    end
  end
end
