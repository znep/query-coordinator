# autoload is not threadsafe, so require everything we might need
requires = %w{view query format render_type}
requires.each{ |r| require File.join(Rails.root, 'app/models', r) }
require 'clytemnestra'

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
      @@page_params = params.reject {|k, v| k == 'controller' || k == 'action' || k == 'path'}
    end

    def self.page_params
      @@page_params
    end

    def self.set_path(path)
      @@page_path = path
    end

    def self.page_path
      @@page_path
    end

    def self.component_data_page(c_id)
      return 1 if @@page_params.nil?
      c_id == @@page_params['data_component'] ? (@@page_params['data_page'] || '1').to_i : 1
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

    def self.app_helper
      AppHelper.instance
    end

    def self.render_partial(partial, assigns={})
      view = ActionView::Base.new(Rails::Configuration.new.view_path)
      ActionView::Base.included_modules.each { |helper| view.extend helper }
      view.extend ApplicationHelper
      view.render(partial, assigns)
    end

  private
    class AppHelper
      include ActionView::Helpers::TagHelper
      include ActionView::Helpers::UrlHelper
      include Singleton
      include ApplicationHelper
    end

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
                 # Woo, backslash
                 repl = p['repl'].gsub(/\$(\d)/, '\\\\\1')
                 r = Regexp.new(p['regex'], p['modifiers'].include?('i'))
                 temp = p['modifiers'].include?('g') ? temp.gsub(r, repl) : temp.sub(r, repl)
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
            threads = @@pending_contexts[id].map do |req|
              Thread.new do
                ds_new = ds.deep_clone
                got_dataset(ds_new, req[:config])
                req[:callback].call(ds_new)
              end
            end
            @@pending_contexts.delete(id)
            threads.each { |thread| thread.join }
          end
        end
      when 'row'
        get_dataset(config) do |ds|
          r = ds.get_rows(1)[:rows][0]
          fr = {}
          ds.visible_columns.each {|c| fr[c.fieldName] = r[c.id.to_s]}
          available_contexts[id] = {id: id, type: config['type'], row: fr}
        end
      end
    end

    def self.load(config)
      threads = config.map do |id, config_item|
        Thread.new { DataContext.load_context(id, config_item) }
      end
      threads.each{ |thread| thread.join }
    end

  private
    def self.add_query(ds, query)
      return if query.blank?
      q = {'orderBys' => [], 'groupBys' => []}.deep_merge(ds.query)
      query.each do |k, v|
        q[k] = (q[k] || ((v.is_a? Array) ? [] : {})).deep_merge(v) if k != 'orderBys' && k != 'groupBys'
      end

      (query['orderBys'] || []).each do |ob|
        ob = ob.clone
        ob['expression'] = ob['expression'].clone
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
        gb = gb.clone
        if defined? gb['fieldName']
          c = ds.column_by_id_or_field_name(gb['fieldName'])
          break if c.blank?
          gb['columnId'] = c.id
          gb.delete('fieldName')
        end
        q['groupBys'] << gb
      end
      q.delete('groupBys') if q['groupBys'].empty?

      ds.query.data.deep_merge!(q)
    end

    def self.get_dataset(config, &callback)
      ds = nil
      if !config['contextId'].blank?
        context = available_contexts[config['contextId']]
        if !context.blank?
          ds = context[:dataset].deep_clone
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
      elsif !config['search'].blank?
        search_response = Clytemnestra.search_views(config['search'].merge({'limit' => 1}))
        ds = search_response.results.first
      end
      if !ds.blank?
        got_dataset(ds, config)
        yield(ds)
      end
      ds
    end

    def self.got_dataset(ds, config)
      add_query(ds, config['query'])
      ds.data['totalRows'] = ds.get_total_rows if config['getTotal']
    end
  end

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
      @context ||= DataContext.available_contexts[@properties['contextId']] if
        @properties.has_key?('contextId')
      @context
    end

    def string_substitute(text, special_resolver = nil)
      Util.string_substitute(text, special_resolver || resolver)
    end

    def render
      c, fully_rendered = render_contents
      html_class = string_substitute(@properties['htmlClass'].is_a?(Array) ?
                                     @properties['htmlClass'].join(' ') : @properties['htmlClass'])
      t = '<div class="socrata-component component-' + @properties['type'] + ' ' +
        (@properties['customClass'] || '') + (@needs_own_context ? '' : (' ' + html_class)) +
        (fully_rendered ? ' serverRendered' : '') +
        '" id="' + self.id + '">'
      t += '<div class="content-wrapper ' + html_class + '">' if @needs_own_context
      t += c
      t += '</div>' if @needs_own_context
      t += '</div>'
    end

    def render_contents
      ['', false]
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

  class Container < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      super(props, parent, resolver_context)
      # Reference the children here so they are instantiated, and get IDs
      children
    end

    def has_children?
      return @children.is_a?(Array) || @properties['children'].is_a?(Array)
    end

    def children
      return nil unless self.has_children?
      @children ||= CanvasWidget.from_config(
        @properties['children'].map do |c|
          c['contextId'] = @properties['childContextId'] || @properties['contextId'] if c['contextId'].blank?
          c
        end, self)
    end

    def render_contents
      return ['', true] if !has_children?
      threads = children.map {|c| Thread.new { c.render }}
      [threads.map {|thread| thread.value}.join(''), true]
    end

  protected
    def children=(children)
      @children = children
    end
  end

  class HorizontalContainer < Container
    def render_contents
      t = ''
      if has_children?
        total_weight = children.reduce(0.0) {|sum, c| sum + (c.properties['weight'] || 1)}
        pos = 0.0
        children.each_with_index do |c, i|
          w = c.properties['weight'] || 1
          t += '<div class="component-wrapper' + (i == 0 ? ' first-child' : '') + '"' +
            ' style="margin-left:' + (-(100 - pos / total_weight * 100)).round(2).to_s + '%;' +
            'width:' + (w / total_weight * 100).round(2).to_s + '%;"' +
            '>' + c.render + '</div>'
          pos += w
        end
      end
      [t += '<div class="socrata-ct-clear"></div>', true]
    end
  end

  class Repeater < Container
    def initialize(props, parent = nil, resolver_context = nil)
      # Can't modify original properties (except to add an ID, if needed); so
      # we render with a copy
      @orig_props = props
      dup_props = props.dup
      dup_props.delete('children')
      super(dup_props, parent, resolver_context)
      props['id'] = @properties['id']

      allocate_ids(props['children'])
      @clone_props = {
        'id' => 'clone',
        'children' => props['children'],
        'htmlClass' => props['childHtmlClass'],
        'styles' => props['childStyles'],
        'type' => 'Container'
      }
    end

    def render_contents
      t = ''
      if !context.blank?
        col_map = {}
        all_c = []
        case context[:type]
        when 'datasetList'
          context[:datasetList].each_with_index {|ds, i| all_c << add_row(ds, i, ds.clone) }
        when 'dataset'
          if @properties['repeaterType'] == 'column'
            ex_f = string_substitute(@properties['excludeFilter'])
            inc_f = string_substitute(@properties['includeFilter'])
            context[:dataset].visible_columns.each_with_index do |c, i|
              if ex_f.all? {|k, v| !(Array.try_convert(v) || [v]).include?(Util.deep_get(c, k))} &&
                (@properties['includeFilter'].blank? ||
                 inc_f.any? {|k, v| (Array.try_convert(v) || [v]).include?(Util.deep_get(c, k))})
                all_c << add_row(context, i, {column: c})
              end
            end
          else
            context[:dataset].visible_columns.each {|c| col_map[c.id.to_s] = c.fieldName}
            rows = context[:dataset].get_rows(100)[:rows].each_with_index do |r, i|
              all_c << add_row(r, i, col_map)
            end
          end
        end
        all_c.compact!
        if all_c.length > 0
          cont_config = @properties['container'] || {'type' => 'Container'}
          @orig_props['container'] = cont_config
          real_c = CanvasWidget.from_config(cont_config, self)
          real_c.children = all_c
          t += real_c.render
        end
      end
      [t, true]
    end

  protected
    def add_row(row, index, col_map = {}, resolutions = {})
      resolutions['_repeaterIndex'] = index
      col_map.each {|id, fieldName| resolutions[fieldName] = row[id]}

      child_props = string_substitute(@properties['childProperties'], resolutions)
      copy = create_copy({}.deep_merge(child_props.is_a?(Hash) ? child_props : {}).deep_merge(@clone_props),
                         self.id + '-' + index.to_s + '-')
      copy['childContextId'] = row[:id]
      c = CanvasWidget.from_config(copy, self, resolutions)
      if @properties.has_key?('valueRegex')
        r = Regexp.new(@properties['valueRegex']['regex'])
        v = c.string_substitute(@properties['valueRegex']['value'])
        result = r.match(v).blank?
        result = !result if @properties['valueRegex']['invert']
        return nil if result
      end
      c
    end

    def allocate_ids(components)
      (components || []).each do |c|
        c['id'] = Util.allocate_id if c['id'].blank?
        allocate_ids(c['children'])
      end
    end

    def create_copy(component, id_prefix)
      new_c = component.clone
      new_c['htmlClass'] = new_c['htmlClass'].is_a?(Array) ? new_c['htmlClass'] : [new_c['htmlClass']].compact
      new_c['htmlClass'] << 'id-' + new_c['id']
      new_c['id'] = id_prefix + new_c['id']
      if new_c['children'].is_a? Array
        new_c['children'] = new_c['children'].map {|c| create_copy(c, id_prefix)}
      end
      new_c
    end
  end

  class Title < CanvasWidget
    def render_contents
      ['<h2>' + string_substitute(@properties['text']) + '</h2>', true]
    end
  end

  class Text < CanvasWidget
    def render_contents
      [string_substitute(@properties['html']), true]
    end
  end

  class DataRenderer < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      ds = !context.blank? ? context[:dataset] : nil
      return ['', false] if ds.blank?

      page_size = 20
      current_page = Util.component_data_page(self.id)
      row_results = ds.get_rows(page_size, current_page, {}, true)

      t = '<div class="dataTableWrapper">'
      t += RenderType.table_html(self.id, ds.visible_columns, row_results[:rows], ds,
                                (current_page - 1) * page_size)

      # Paging
      path = Util.page_path
      params = Util.page_params.clone
      params['data_component'] = self.id
      path += '?' + params.map {|k, v| k + '=' + v}.join('&')
      t += Util.app_helper.create_pagination_without_xss_safety(
        row_results[:meta]['totalRows'], page_size, current_page, path, '', 'data_page')

      t += '<a href="' + ds.alt_href + '" class="altViewLink">Accessibly explore the data</a>'
      t += '</div>'
    end
  end

  class Chart < DataRenderer
  end
  class AreaChart < DataRenderer
  end
  class BarChart < DataRenderer
  end
  class BubbleChart < DataRenderer
  end
  class ColumnChart < DataRenderer
  end
  class DonutChart < DataRenderer
  end
  class LineChart < DataRenderer
  end
  class PieChart < DataRenderer
  end
  class TimelineChart < DataRenderer
  end
  class TreemapChart < DataRenderer
  end

  class Calendar < DataRenderer
  end

  class Map < DataRenderer
  end

  class Table < DataRenderer
  end

  class Menu < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class Download < CanvasWidget
    def render_contents
       ['<a href="' + context[:dataset].download_url('csv') + '" class="button" rel="external">' +
         'Download this data</a>', true]
    end
  end

  class InlineFilter < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class Pager < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class PagedContainer < Container
  end

  class FixedContainer < Container
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class EventConnector < CanvasWidget
    def render
      ''
    end
  end
end
