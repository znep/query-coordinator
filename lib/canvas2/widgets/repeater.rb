module Canvas2
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
      fully_rendered = true
      all_c = []
      if !context.blank?
        col_map = {}
        col_field_name_map = {}

        if context.is_a? Array
          context.each_with_index { |item, i| all_c << add_row(item, i, item.clone) }

        elsif context[:type] == 'datasetList'
          context[:datasetList].each_with_index {|ds, i| all_c << add_row(ds, i, ds.clone) }

        elsif context[:type] == 'dataset'
          if @properties['repeaterType'] == 'column'
            ex_f = string_substitute(@properties['excludeFilter'])
            ex_f = [] if ex_f.blank?
            inc_f = string_substitute(@properties['includeFilter'])
            inc_f = [] if inc_f.blank?
            context[:dataset].visible_columns.each_with_index do |c, i|
              if ex_f.all? {|k, v| !(Array.try_convert(v) || [v]).include?(Util.deep_get(c, k))} &&
                (@properties['includeFilter'].blank? ||
                 inc_f.any? {|k, v| (Array.try_convert(v) || [v]).include?(Util.deep_get(c, k))})
                all_c << add_row(context, i, {column: c})
              end
            end

          else
            context[:dataset].visible_columns.each {|c| 
              col_map[c.id.to_s] = c.fieldName
              col_field_name_map[c.fieldName] = c.id
            }
            if Canvas2::Util.debug
              rows = context[:dataset].get_rows(100, 1, {}, false, !Canvas2::Util.is_private)
            else
              rows = context[:dataset].get_cached_rows(100, 1, {}, !Canvas2::Util.is_private)
            end
            rows = rows[:rows].map do |row|
              r = Hash.new
              row.each do |k, v|
                if !col_map[k].blank?
                  r[col_map[k]] = v
                elsif k.match(/[a-z]+/) && col_field_name_map[k].nil? # if user column collides with system column name, user column wins
                  r[k] = v
                end
              end
              r
            end

            if !@properties['groupBy'].blank?
              all_c = render_group_items(rows)
            else
              rows.each_with_index do |r, i|
                all_c << add_row(r, i, r)
              end
            end
          end
        end

        all_c.compact!
      end

      child_timings = []
      if all_c.length > 0 || !@properties['noResultsChildren'].nil?
        cont_config = @properties['container'] || {'type' => 'Container'}
        cont_config['id'] ||= Canvas2::Util.allocate_id
        orig_id = cont_config['id']
        cont_config['id'] = (@properties['parentPrefix'] || '') + cont_config['id']
        real_c = CanvasWidget.from_config(cont_config, self)
        @orig_props['container'] = cont_config
        @orig_props['container']['id'] = orig_id
        real_c.children = all_c.length > 0 ? all_c :
          CanvasWidget.from_config(@properties['noResultsChildren'], self)
        r = real_c.render
        t += r[0]
        fully_rendered &&= r[1]
        child_timings.push(r[2])
      end

      [t, fully_rendered, child_timings]
    end

    def child_context
      nil
    end

  protected
    def add_row(row, index, resolutions = {})
      resolutions['_repeaterIndex'] = index
      resolutions['_repeaterDisplayIndex'] = index + 1
      resolutions['_evenOdd'] = (index % 2) == 0 ? 'even' : 'odd'

      child_props = string_substitute(@properties['childProperties'], resolutions)
      copy = create_copy({}.deep_merge(@clone_props).deep_merge(child_props.is_a?(Hash) ? child_props : {}),
                         self.id + '-' + index.to_s + '-', resolutions)
      copy['childContextId'] = row[:id]
      c = CanvasWidget.from_config(copy, self, resolutions)
      if @properties.has_key?('valueRegex')
        r = Regexp.new(c.string_substitute(@properties['valueRegex']['regex']))
        v = c.string_substitute(@properties['valueRegex']['value'])
        result = r.match(v).blank?
        result = !result if @properties['valueRegex']['invert']
        return nil if result
      end
      c
    end

    def render_group_items(items)
      g_config = @properties['groupBy']
      g_index = Hash.new
      groups = []
      items.each do |item|
        g = string_substitute(g_config['value'], item)
        next if g.blank?
        g = g_config['splitOn'].blank? ? [g] : g.split(g_config['splitOn'])
        g.each do |gg|
          if g_index[gg].blank?
            groups << gg
            g_index[gg] = [item]
          else
            g_index[gg] << item
          end
        end
      end

      all_c = []
      groups = groups.sort if g_config['sortAlpha']
      groups.each_with_index do |g, i|
        all_c << add_row({id: g}, i, {_groupValue: g, _groupItems: g_index[g]})
      end
      all_c
    end

    def allocate_ids(components)
      (components || []).each do |c|
        c['id'] = Util.allocate_id if c['id'].blank?
        allocate_ids(c['children'])
      end
    end

    def create_copy(component, id_prefix, resolutions)
      new_c = component.clone
      new_c['htmlClass'] = new_c['htmlClass'].is_a?(Array) ? new_c['htmlClass'].clone :
        [new_c['htmlClass']].compact
      new_c['htmlClass'] << 'id-' + new_c['id']
      new_c['parentPrefix'] = id_prefix
      new_c['id'] = id_prefix + new_c['id']
      new_c['entity'] = resolutions
      if new_c['type'] != 'Repeater' && new_c['children'].is_a?(Array)
        new_c['children'] = new_c['children'].map {|c| create_copy(c, id_prefix, resolutions)}
      end
      new_c
    end
  end
end
