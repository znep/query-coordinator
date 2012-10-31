module Canvas2
  class DataContext
    def self.available_contexts
      return @available_contexts ||= {}
    end

    def self.errors
      return @errors ||= []
    end

    def self.timings
      return @timings ||= []
    end

    def self.reset
      @available_contexts = {}
      @errors = []
      @timings = []
    end

    def self.load_context(id, config)
      start_time = Time.now
      config = Util.string_substitute(config, Util.base_resolver)
      config[:id] = id
      ret_val = true
      begin
        case config['type']
        when 'datasetList'
          search_response = Clytemnestra.search_views(config['search'])
          ds_list = search_response.results.reject do |ds|
            add_query(ds, config['query'])
            ds.get_total_rows < 1
          end
          if ds_list.length > 0
            available_contexts[id] = {id: id, type: config['type'],
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
            available_contexts[id] = {id: id, type: config['type'], dataset: ds}
            log_timing(start_time, config)
            if (defined? @pending_contexts) && (((@pending_contexts || {})[id]).is_a? Array)
              threads = @pending_contexts[id].map do |req|
                Thread.new do
                  begin
                    ds_new = req[:config]['keepOriginal'] ? ds : ds.deep_clone(View)
                    got_dataset(ds_new, req[:config])
                    req[:callback].call(ds_new)
                  rescue CoreServer::CoreServerError => e
                    raise DataContextError.new(req[:config], "Core server failed: " + e.error_message,
                                             { path: e.source, payload: JSON.parse(e.payload || '{}') })
                  end
                end
              end
              @pending_contexts.delete(id)
              return threads.map { |thread| thread.value }.reduce(true) {|accum, v| accum && v}
            end
            return true
          end)

        when 'column'
          ret_val = get_dataset({'keepOriginal' => config['query'].blank?}.merge(config), lambda do |ds|
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
            available_contexts[id] = { id: id, type: config['type'], column: col, parent_dataset: ds }
            log_timing(start_time, config)
            return true
          end)

        when 'row'
          ret_val = get_dataset(config, lambda do |ds|
            # Cache single-row requests
            if Canvas2::Util.debug
              r = ds.get_rows(1)[:rows][0]
            else
              r = ds.get_cached_rows(1)[:rows][0]
            end

            if r.nil?
              errors.push(DataContextError.new(config, "No row found for '" + id + "'"))
              log_timing(start_time, config)
              return !config['required']
            end

            fr = {}
            ds.visible_columns.each {|c| fr[c.fieldName] = r[c.id.to_s]}
            available_contexts[id] = {id: id, type: config['type'], row: fr}
            log_timing(start_time, config)
            return true
          end)
        end
      rescue CoreServer::CoreServerError => e
        raise DataContextError.new(config, "Core server failed: " + e.error_message,
                                 { path: e.source, payload: JSON.parse(e.payload || '{}') })
        log_timing(start_time, config)
      end
      return ret_val
    end

    def self.load(config)
      threads = config.map do |id, config_item|
        Thread.new { DataContext.load_context(id, config_item) }
      end
      threads.map { |thread| thread.value }.reduce(true) {|accum, v| accum && v}
    end

  private
    def self.add_query(ds, query)
      return if query.blank?
      q = {'orderBys' => [], 'groupBys' => []}.deep_merge(ds.query)
      query.each do |k, v|
        q[k] = (q[k] || ((v.is_a? Array) ? [] : {})).deep_merge(v) if k != 'orderBys' &&
          k != 'groupBys' && k != 'groupedColumns'
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
          ds = config['keepOriginal'] ? context[:dataset] : context[:dataset].deep_clone(View)
        else
          @pending_contexts ||= {}
          @pending_contexts[config['contextId']] ||= []
          @pending_contexts[config['contextId']] << {config: config, callback: callback}
        end
      elsif !config['datasetId'].blank?
        begin
          ds = View.find(config['datasetId'])
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
          ds = View.find_by_resource_name(config['datasetResourceName'])
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
        search_response = Clytemnestra.search_views(config['search'].merge({'limit' => 1}))
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
      ds.data['totalRows'] = ds.get_total_rows if config['getTotal']
    end

    def self.log_timing(start_time, config)
      timings.push("#{config[:id]} took #{(Time.now - start_time) * 1000} ms")
    end
  end
end
