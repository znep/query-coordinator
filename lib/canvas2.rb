module Canvas2

# GENERAL

  class Util
    def self.allocate_id
      @@next_auto_id = 0 if !(defined? @@next_auto_id)
      's' + (@@next_auto_id += 1).to_s
    end

    def self.string_substitute(obj, resolver)
      if obj.blank?
        return ''
      elsif obj.is_a? String
        return Util.resolve_string(obj, resolver)
      elsif obj.is_a? Array
        return obj.map {|o| Util.string_substitute(o, resolver)}
      elsif obj.is_a? Hash
        o = {}
        obj.each {|k, v| o[k] = Util.string_substitute(v, resolver)}
        return o
      else
        return obj
      end
    end

    def self.set_params(params)
      @@page_params = params
    end

    def self.base_resolver
      lambda do |name|
        if name[0] == '?' && defined? @@page_params
          return deep_get(@@page_params, name.slice(1, name.length))
        end
        nil
      end
    end

    def self.deep_get(obj, field)
      obj = obj.data if obj.is_a?(Model)
      obj = obj.with_indifferent_access
      keys = field.split('.')
      i = 0
      while i < keys.length do
        k = keys[i]
        obj = obj.data if obj.is_a?(Model)
        return nil if obj[k].blank?
        obj = obj[k]
        i += 1
      end
      obj
    end

  private
    def self.resolve_string(str, resolver)
      @@resolve_cache ||= {}
      compiled = @@resolve_cache[str]
      if compiled.blank?
        fn = lambda {|r| ''}
        m = str.split(/({|})/m)
        props = []
        i = 0
        while i < m.length do
          p = {}
          if m[i] == '{' && m[i + 2] == '}'
            p['orig'] = m[i + 1]
            p['prop'] = p['orig']
            p['prop'].match(/(.*)\s+\|\|\s*(.*)$/) do |m|
              p['prop'] = m[1]
              p['fallback'] = m[2]
            end
            p['prop'].match(/(.*)\s+\/(\S*)\/(.*)\/([gi]*)$/) do |m|
              p['prop'] = m[1]
              p['regex'] = m[2]
              p['repl'] = m[3]
              p['modifiers'] = m[4]
            end
            i += 2
          else
            p['orig'] = m[i]
          end
          props << p
          i += 1
        end
        fn = Util.resolution_builder(props)
        @@resolve_cache[str] = fn
        compiled = @@resolve_cache[str]
      end
      compiled.call(resolver)
    end

    def self.resolution_builder(props)
      lambda do |resolver|
        if !resolver.is_a? Proc
          obj = resolver || {}
          resolver = lambda {|name| deep_get(obj, name)}
        end
        return props.map do |p|
          v = p['orig']
          if !p['prop'].blank?
            temp = resolver.call(p['prop'])
            if temp.blank?
              temp = p.has_key?('fallback') ? p['fallback'] : '{' + p['orig'] + '}'
            else
               if p.has_key?('regex')
                 r = Regexp.new(p['regex'], p['modifiers'].include?('i'))
                 temp = p['modifiers'].include?('g') ? temp.gsub(r, p['repl']) : temp.sub(r, p['repl'])
               end
            end
            v = temp
          end
          v
        end.join('')
      end
    end
  end

  class DataContext
    def self.available_contexts
      return @@available_contexts ||= {}
    end

    def self.load_context(id, config)
      config = Util.string_substitute(config, Util.base_resolver)
      case config['type']
      when 'datasetList'
        search_response = Clytemnestra.search_views(config['search'])
        available_contexts[id] = {id: id, type: config['type'],
          count: search_response.count,
          datasetList: search_response.results.map do |ds|
            add_query(ds, config['query'])
            c = {type: 'dataset', dataset: ds, id: id + '_' + ds.id}
            available_contexts[c[:id]] = c
          end}
      when 'dataset'
        get_dataset(config) do |ds|
          available_contexts[id] = {id: id, type: config['type'], dataset: ds}
          if (defined? @@pending_contexts) && (((@@pending_contexts || {})[id]).is_a? Array)
            @@pending_contexts[id].each {|req| req[:callback].call(ds)}
            @@pending_contexts.delete(id)
          end
        end
      when 'row'
        get_dataset(config) do |ds|
          r = ds.get_rows(1)[0]
          fr = {}
          ds.visible_columns.each {|c| fr[c.fieldName] = r[c.id.to_s]}
          available_contexts[id] = {id: id, type: config['type'], row: fr}
        end
      end
    end

    def self.load(config)
      config.each do |id, config_item|
        DataContext.load_context(id, config_item)
      end
    end

  private
    def self.add_query(ds, query)
      return if query.blank?
      q = {'orderBys' => [], 'groupBys' => []}.deep_merge(ds.query)
      query.each do |k, v|
        q[k] = (q[k] || ((v.is_a? Array) ? [] : {})).deep_merge(v) if k != 'orderBys' && k != 'groupBys'
      end

      (query['orderBys'] || []).each do |ob|
        if defined? ob['expression']['fieldName']
          c = ds.column_by_id_or_field_name(ob['expression']['fieldName'])
          break if c.blank?
          ob['expression']['columnId'] = c.id
          ob['expression'].delete('fieldName')
        end
        q['orderBys'] << ob
      end
      q.delete('orderBys') if q['orderBys'].empty?

      (query['groupBys'] || []).each do |gb|
        if defined? gb['fieldName']
          c = ds.column_by_id_or_field_name(gb['fieldName'])
          break if c.blank?
          gb['columnId'] = c.id
          gb.delete('fieldName')
        end
        q['groupBys'] << gb
      end
      q.delete('groupBys') if q['groupBys'].empty?

      ds.query.data.deep_merge!(query)
    end

    def self.get_dataset(config, &callback)
      ds = nil
      if !config['contextId'].blank?
        context = available_contexts[config['contextId']]
        if !context.blank?
          ds = context[:dataset].deep_dup
        else
          @@pending_contexts ||= {}
          @@pending_contexts[config['contextId']] ||= []
          @@pending_contexts[config['contextId']] << {config: config, callback: callback}
        end
      elsif !config['datasetId'].blank?
        begin
          ds = View.find(config['datasetId'])
        rescue CoreServer::ResourceNotFound
        rescue CoreServer::CoreServerError
        end
      end
      if !ds.blank?
        add_query(ds, config['query'])
        yield(ds)
      end
      ds
    end

  end

  class CanvasWidget
    attr_accessor :id, :parent

    def initialize(props, resolver_context = nil)
      @properties = props
      @resolver_context = resolver_context
      @properties['id'] ||= Canvas2::Util.allocate_id
      self.id = @properties['id']

      if @properties.has_key?('context')
        c_id = 'context-' + self.id
        DataContext.load_context(c_id, @properties['context'])
        @context = DataContext.available_contexts[c_id]
      end
    end

    def properties
      return @properties
    end

    def method_missing(key, *args)
      return @properties[key.to_s]
    end

    def context
      @context ||= DataContext.available_contexts[@properties['contextId']] if
        @properties.has_key?('contextId')
      @context
    end

    def render
      '<div class="component-' + @properties['type'] + '" id="' + self.id + '">' + self.class.to_s + '</div>'
    end

    def resolver
      parent_resolver = !self.parent.blank? ? self.parent.resolver() : Util.base_resolver()
      lambda do |name|
        v = Util.deep_get((@resolver_context || {}), name)
        v = Util.deep_get((context || {}), name) if v.blank?
        v = parent_resolver.call(name) if v.blank?
        v
      end
    end

    def self.from_config(config, resolver_context = nil)
      if config.is_a? Array
        i = 0
        return config.map do |config_item|
          i += 1
          CanvasWidget.from_config(config_item, resolver_context)
        end
      else
        # eg 'two_column_layout' ==> 'TwoColumnLayout'
        klass_name = config['type'].gsub(/^(.)|(_.)/){ |str| str[-1].upcase }
        begin
          return Canvas2.const_get(klass_name).new(config, resolver_context)
        rescue NameError => ex
          throw "There is no Canvas2 widget of type '#{config['type']}'."
        end
      end
    end
  end

  class Container < CanvasWidget
    def initialize(props, resolver_context = nil)
      super(props, resolver_context)
      # Reference the children here so they are instantiated, and get IDs
      children
    end

    def has_children?
      return @properties['children'].is_a? Array
    end

    def children
      return nil unless self.has_children?
      @children ||= CanvasWidget.from_config(
        @properties['children'].map do |c|
          c['contextId'] = @properties['childContextId'] || @properties['contextId'] if c['contextId'].blank?
          c
        end)
      @children.each {|c| c.parent = self}
    end

    def render
      t = '<div class="socrata-container component-' + @properties['type'] + '" id="' + self.id + '">'
      children.each {|c| t += c.render} if has_children?
      t += '</div>'
    end

  protected
    def children=(children)
      @children = children
    end
  end

  class HorizontalContainer < Container
  end

  class Repeater < Container
    def initialize(props, resolver_context = nil)
      # Can't modify original properties (except to add an ID, if needed); so
      # we render with a copy
      dup_props = props.dup
      dup_props.delete('children')
      super(dup_props, resolver_context)
      props['id'] = @properties['id']

      allocate_ids(props['children'])
      @clone_props = {
        'id' => 'clone',
        'children' => props['children'],
        'type' => 'Container'
      }
    end

    def render
      t = '<div class="socrata-container component-' + @properties['type'] + '" id="' + self.id + '">'
      if !context.blank?
        col_map = {}
        case context[:type]
        when 'datasetList'
          context[:datasetList].each_with_index {|ds, i| t += add_row(ds, i)}
        when 'dataset'
          if @properties['repeaterType'] == 'column'
            ex_f = Util.string_substitute(@properties['excludeFilter'], resolver)
            inc_f = Util.string_substitute(@properties['includeFilter'], resolver)
            context[:dataset].visible_columns.each_with_index do |c, i|
              if ex_f.all? {|k, v| !(Array.try_convert(v) || [v]).include?(Util.deep_get(c, k))} &&
                (@properties['includeFilter'].blank? ||
                 inc_f.any? {|k, v| (Array.try_convert(v) || [v]).include?(Util.deep_get(c, k))})
                t += add_row(context, i, {column: c})
              end
            end
          else
            context[:dataset].visible_columns.each {|c| col_map[c.id.to_s] = c.fieldName}
            rows = context[:dataset].get_rows(100).each_with_index do |r, i|
              t += add_row(r, i, col_map)
            end
          end
        end
      end
      t += '</div>'
    end

  protected
    def add_row(row, index, col_map = {})
      resolutions = {}
      col_map.each {|id, fieldName| resolutions[fieldName] = row[id]}

      copy = create_copy(@clone_props, self.id + '-' + index.to_s + '-')
      copy['childContextId'] = row[:id]
      c = CanvasWidget.from_config(copy, resolutions)
      c.parent = self
      c.render
    end

    def allocate_ids(components)
      (components || []).each do |c|
        c['id'] = Util.allocate_id if c['id'].blank?
        allocate_ids(c['children'])
      end
    end

    def create_copy(component, id_prefix)
      new_c = component.clone
      new_c['id'] = id_prefix + new_c['id']
      if new_c['children'].is_a? Array
        new_c['children'] = new_c['children'].map {|c| create_copy(c, id_prefix)}
      end
      new_c
    end
  end

  class Title < CanvasWidget
    def render
      '<div class="component-Title" id="' + self.id + '"><h2>' +
        Util.string_substitute(self.text, resolver) + '</h2></div>'
    end
  end

  class Text < CanvasWidget
    def render
      '<div class="component-Text" id="' + self.id + '">' +
        Util.string_substitute(self.html, resolver) + '</div>'
    end
  end

  class LineChart < CanvasWidget
  end
  class ColumnChart < CanvasWidget
  end

  class Table < CanvasWidget
  end

  class Download < CanvasWidget
  end

  class InlineFilter < CanvasWidget
  end

  class Pager < CanvasWidget
  end

  class PagedContainer < Container
  end
end
