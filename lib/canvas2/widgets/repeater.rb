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
        if context.is_a?(Array)
          context.each_with_index do |item, i|
            item = { value: item } if !item.is_a?(Hash)
            all_c << add_row(item, i, item.clone)
          end
        elsif context[:type] == 'list'
          context[:list].each_with_index do |item, i|
            item = { value: item } if !item.is_a?(Hash)
            all_c << add_row(item, i, item.clone)
          end
        elsif context[:type] == 'goalList'
          if !@properties['groupBy'].blank?
            all_c = render_group_items(context[:goalList])
          else
            context[:goalList].each_with_index {|g, i| all_c << add_row(g, i, g.clone) }
          end

        elsif context[:type] == 'goalDashboard'
          if !@properties['groupBy'].blank?
            all_c = render_group_items(context[:dashboard]['categories'])
          else
            context[:dashboard]['categories'].each_with_index {|c, i| all_c << add_row(c, i, c.clone) }
          end

        elsif context[:type] == 'govstatCategoryList'
          if !@properties['groupBy'].blank?
            all_c = render_group_items(context[:categoryList])
          else
            context[:categoryList].each_with_index {|c, i| all_c << add_row(c, i, c.clone) }
          end

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
            row_count = [1, string_substitute(@properties['rowCount'] || 100).to_i].max
            row_page = [1, string_substitute(@properties['rowPage'] || 1).to_i].max
            if Canvas2::Util.no_cache
              rows = context[:dataset].get_rows(row_count, row_page, {}, false, !Canvas2::Util.is_private)
            else
              rows = context[:dataset].get_cached_rows(row_count, row_page, {}, !Canvas2::Util.is_private)
            end
            rows = rows[:rows].map { |row| context[:dataset].row_to_SODA2(row) }

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
        # Enable hack to prepend special item to Repeater
        real_c.children ||= []
        real_c.children.concat(all_c.length > 0 ? all_c :
           @properties['noResultsChildren'].nil? ? nil :
           [CanvasWidget.from_config({ type: 'Container', id: self.id + '_noChildren-clone',
             children: @properties['noResultsChildren'] }.with_indifferent_access, self)])
        r = real_c.render
        t += r[0]
        fully_rendered &&= r[1]
        child_timings.push(r[2])
      end

      [t, fully_rendered, child_timings]
    end

    def child_resolver
      parent_resolver = self.parent.child_resolver() if !self.parent.blank?
      parent_resolver = Util.base_resolver() if parent_resolver.blank?
      lambda do |name|
        if !context.blank?
          keyed_c = {}
          context.is_a?(Array) ?
            context.each { |dc| keyed_c[dc[:id]] = dc if dc.is_a?(Hash) } : (keyed_c[context[:id]] = context)
          v = Util.deep_get(keyed_c, name)
        end
        v = parent_resolver.call(name) if v.blank?
        v
      end
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
