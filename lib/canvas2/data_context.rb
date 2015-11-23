require 'clytemnestra'

module Canvas2
  class DataContext
    def self.available_contexts
      return @available_contexts ||= {}
    end

    def self.streaming_contexts
      return @streaming_contexts ||= {}
    end

    def self.extra_config
      return @extra_config ||= {}
    end

    def self.errors
      return @errors ||= []
    end

    def self.timings
      return @timings ||= []
    end

    def self.prefetch
      prefetch = []
      @available_contexts.map { |ctx|
         if !ctx[1][:dataset].nil? && ctx[1][:dataset].sodacan
           prefetch << { :context =>  ctx[1][:id], :metrics => ctx[1][:dataset].sodacan.metrics, :hints => ctx[1][:dataset].sodacan.hints}
         end
      }
      prefetch
    end

    def self.reset
      @available_contexts = {}
      @streaming_contexts = {}
      @extra_config = {}
      @errors = []
      @timings = []
      @manifest = Manifest.new
    end

    # Get the data manifest for a dataslate page
    # A manifest is the list of resources used by the
    # system along with an associated check time for that resource
    def self.manifest
      @available_contexts.each { |ctx|
        if !ctx[1].nil? && !ctx[1][:dataset].nil?
          @manifest.add_resource(ctx[1][:dataset].id, ctx[1][:dataset].check_time)
        end
      }
      @manifest.add_resource("pages",Time.now.to_i)
      @manifest
    end

    def self.set_context_as_streaming(id)
      if !available_contexts[id].nil? && !available_contexts[id][:exclude_context]
        streaming_contexts[id] = available_contexts[id].clone
        streaming_contexts[id].delete(:exclude_context)
        streaming_contexts[id].delete(:dataset) if streaming_contexts[id][:exclude_ds]
        streaming_contexts[id].delete(:exclude_ds)
      end
    end

    def self.add_extra_config(id, conf)
      extra_config[id] = conf
    end

    def self.load_context(id, config)
      start_time = Time.now
      config = Util.string_substitute(config, Util.base_resolver)
      config[:id] = id
      ret_val = true
      begin
        extra_opts = Util.context_options(id)
        if extra_opts.present? && extra_opts.is_a?(Hash)
          config.merge!(extra_opts)
          add_extra_config(id, extra_opts)
        end
        case config['type']
        when 'list'
          l = config['list']
          l = Util.string_substitute('{' + l + ' ||}', Util.base_resolver).split(', ') if l.is_a?(String)
          available_contexts[id] = {id: id, type: config['type'], list: l, count: l.length}
          log_timing(start_time, config)

        when 'datasetList'
          search_response = Canvas2::Util.no_cache ? Clytemnestra.search_views(config['search'], false, !Canvas2::Util.is_private) : Clytemnestra.search_cached_views(config['search'], false, !Canvas2::Util.is_private)
          # Search results are considered part of the manifest; but are handled differently during validation
          @manifest.add_resource(search_response.id, search_response.check_time)
          ds_list = search_response.results.reject do |ds|
            got_dataset(ds, config)
            config['requireData'] && ds.get_total_rows({}, !Canvas2::Util.is_private) < 1
          end
          if ds_list.length > 0 || config['noFail']
            available_contexts[id] = {id: id, type: config['type'], search: config['search'],
              count: search_response.count - (search_response.results.length - ds_list.length),
              datasetList: ds_list.map do |ds|
                c = {type: 'dataset', dataset: ds, id: id + '_' + ds.id}
                available_contexts[c[:id]] = c
              end}
          elsif config['required']
            errors.push(DataContextError.new(config, "No datasets found for datasetList '" + id + "'"))
            ret_val = false
          end
          log_timing(start_time, config)

        when 'dataset'
          ret_val = get_dataset(config, lambda do |ds|
            available_contexts[id] = { id: id, type: config['type'], dataset: ds,
              exclude_context: config['keepOriginal'] || config['useParentPrefetch'] }
            log_timing(start_time, config)
            if (defined? @pending_contexts) && (((@pending_contexts || {})[id]).is_a? Array)
              results = QueueThreadPool.process_list(@pending_contexts[id]) do |req|
                begin
                  ds_new = req[:config]['keepOriginal'] || req[:config]['useParentPrefetch'] ?
                    ds : ds.deep_clone(::View)
                  ds.set_sodacan(req[:config]['useParentPrefetch'] ? context[:dataset].sodacan : nil)
                  got_dataset(ds_new, req[:config])
                  req[:callback].call(ds_new)
                rescue CoreServer::CoreServerError => e
                  raise DataContextError.new(req[:config], "Core server failed: " + e.error_message,
                                           { path: e.source, payload: JSON.parse(e.payload || '{}') })
                end
              end
              @pending_contexts.delete(id)
              return results.reduce(true) {|accum, v| accum && v}
            end
            return true
          end)

        when 'column'
          keep_orig = config['query'].blank?
          ret_val = get_dataset({ 'keepOriginal' => keep_orig }.merge(config), lambda do |ds|
            col = ds.column_by_id_or_field_name(config['columnId'])
            if col.nil?
              errors.push(DataContextError.new(config, "No column '" + config['columnId'] +
                                               "' found for '" + id + "'"))
              log_timing(start_time, config)
              return !config['required']
            end

            if !config['aggregate'].blank?
              aggs = {}
              aggs[col.id] = config['aggregate'].is_a?(Array) ? config['aggregate'] : [config['aggregate']]
              ds.get_aggregates(aggs)
            end
            available_contexts[id] = { id: id, type: config['type'], column: col, dataset: ds,
              exclude_ds: keep_orig }
            log_timing(start_time, config)
            return true
          end)

        when 'row'
          ret_val = get_dataset(config, lambda do |ds|
            if config.key?('rowId')
              r = ds.get_row(config['rowId'], !Canvas2::Util.is_private)
            else
              # Cache single-row requests
              if Canvas2::Util.no_cache
                r = ds.get_rows(1, 1, {}, false, !Canvas2::Util.is_private)[:rows][0]
              else
                r = ds.get_cached_rows(1, 1, {}, !Canvas2::Util.is_private)[:rows][0]
              end
            end

            if r.nil?
              errors.push(DataContextError.new(config, "No row found for '" + id + "'"))
              log_timing(start_time, config)
              return !config['required']
            end

            available_contexts[id] = { id: id, type: config['type'], row: ds.row_to_SODA2(r) }
            log_timing(start_time, config)
            return true
          end)

        when 'goalDashboard'
          begin
            dashboard = Canvas2::Util.odysseus_request('/stat/objects/dashboard/' + config['dashboardId'],
                                                       {}, !Canvas2::Util.is_private)
          rescue CoreServer::ResourceNotFound
            errors.push(DataContextError.new(config, "No dashboard found for '" + id + "'"))
            log_timing(start_time, config)
            return !config['required']
          end

          available_contexts[id] = { id: id, type: config['type'], dashboard: dashboard }
          log_timing(start_time, config)

        when 'goal2'
          goal = Canvas2::Util.odysseus_request('/stat/objects/goal/' + config['goalId'], {},
                                               !Canvas2::Util.is_private)
          if goal.nil?
            errors.push(DataContextError.new(config, "No goal 2.0 found for '" + id + "'"))
            log_timing(start_time, config)
            return !config['required']
          end

          available_contexts[id] = { id: id, type: config['type'], goal: goal }
          log_timing(start_time, config)

        end
      rescue CoreServer::CoreServerError => e
        log_timing(start_time, config)
        raise DataContextError.new(config, "Core server failed: " + e.error_message,
                                 { path: e.source, payload: JSON.parse(e.payload || '{}') })
      end
      return ret_val
    end

    def self.load(config)
      QueueThreadPool.process_list(config) do |id, config_item|
        DataContext.load_context(id, config_item)
      end.reduce(true) {|accum, v| accum && v}
    end

  private
    def self.add_query(ds, query)
      return if query.blank?
      q = {'orderBys' => [], 'groupBys' => []}.deep_merge(ds.query)
      query.each do |k, v|
        q[k] = (q[k] || ((v.is_a? Array) ? [] : {})).deep_merge(v) if k != 'orderBys' &&
          k != 'groupBys' && k != 'groupedColumns' && k != 'searchString'
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
      ds.data['searchString'] = query['searchString'] if !query['searchString'].blank?

      if !q['groupBys'].blank?
        cols = []
        q['groupBys'].each { |gb| cols.push(ds.column_by_id_or_field_name(gb['columnId'])) }
        (query['groupedColumns'] || []).each do |gc|
          c = ds.column_by_id_or_field_name(gc['columnId'])
          if !c.blank?
            c.data['format'] ||= {}
            c.data['format']['grouping_aggregate'] = gc['aggregate']
            cols.push(c)
          end
        end
        ds.custom_vis_cols = cols.compact
      end
    end

    def self.get_dataset(config, callback)
      ds = nil
      if !config['contextId'].blank?
        context = available_contexts[config['contextId']]
        if !context.blank?
          if context[:dataset].blank?
            if config['required']
              errors.push(DataContextError.new(config, "No dataset in original context '" + context[:id] +
                          "' for derived context '" + config['id'] + "'"))
              return false
            else
              return true
            end
          end
          ds = config['keepOriginal'] || config['useParentPrefetch'] ?
            context[:dataset] : context[:dataset].deep_clone(::View)
          ds.set_sodacan(config['useParentPrefetch'] ? context[:dataset].sodacan : nil)
        else
          @pending_contexts ||= {}
          @pending_contexts[config['contextId']] ||= []
          @pending_contexts[config['contextId']] << {config: config, callback: callback}
        end
      elsif !config['datasetId'].blank?
        begin
          # In general caching the metadata is dangerous, because there is always a window
          # in which the metadata columnids may not match truth - when we move to SODA2
          # we may consider it again
          ds = ::View.find(config['datasetId'], {}, false, !Canvas2::Util.is_private)
        rescue CoreServer::ResourceNotFound
          errors.push(DataContextError.new(config, "No dataset found for '" +
                                           (config['id'] || config['datasetId']) + "'"))
          return false if config['required']
        rescue CoreServer::CoreServerError => e
          errors.push(DataContextError.new(config, "Core server failed: " + e.error_message,
                                           { path: e.source, payload: JSON.parse(e.payload || '{}') }))
          return false if config['required']
        end
      elsif !config['datasetResourceName'].blank?
        begin
          ds = ::View.find_by_resource_name(config['datasetResourceName'], !Canvas2::Util.is_private)
        rescue CoreServer::ResourceNotFound
          errors.push(DataContextError.new(config, "No dataset found for '" +
                                           (config['datasetResourceName'] + "'")))
          return false if config['required']
        rescue CoreServer::CoreServerError => e
          errors.push(DataContextError.new(config, "Core server failed: " + e.error_message,
                                           { path: e.source, payload: JSON.parse(e.payload || '{}') }))
          return false if config['required']
        end
      elsif !config['search'].blank?
        search_config = config['search'].merge({'limit' => 1})
        search_response = Clytemnestra.search_views(search_config, false, !Canvas2::Util.is_private)
        ds = search_response.results.first
        if ds.nil? && config['required']
          errors.push(DataContextError.new(config, "No dataset found for '" +
                                           (config['id'] || '(inline)') + "'"))
          return false
        end
      end
      if !ds.blank?
        got_dataset(ds, config)
        return callback.call(ds)
      end
      return true
    end

    def self.got_dataset(ds, config)
      add_query(ds, config['query']) if !config['keepOriginal']
      if ds.sodacan.nil? && config['prefetch']
        ds.prefetch(config['prefetch'])
      end

      # Hack to make some DataSlate subst properties work
      ds.data['styleClass'] = ds.display.type.capitalize
      ds.data['displayName'] = ds.display.name
      ds.data['preferredImage'] = ds.preferred_image
      ds.data['preferredImageType'] = ds.preferred_image_type

      ds.data['totalRows'] = ds.get_total_rows({}, !Canvas2::Util.is_private) if config['getTotal']
    end

    def self.log_timing(start_time, config)
      timings.push("#{config[:id]} took #{(Time.now - start_time) * 1000} ms")
    end
  end
end
