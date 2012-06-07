module Canvas2
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
        if !get_dataset(config) do |ds|
          available_contexts[id] = {id: id, type: config['type'], dataset: ds}
          if (defined? @@pending_contexts) && (((@@pending_contexts || {})[id]).is_a? Array)
            threads = @@pending_contexts[id].map do |req|
              Thread.new do
                ds_new = ds.deep_clone(View)
                got_dataset(ds_new, req[:config])
                req[:callback].call(ds_new)
              end
            end
            @@pending_contexts.delete(id)
            threads.each { |thread| thread.join }
          end
        end
          return false
        end
      when 'row'
        get_dataset(config) do |ds|
          r = ds.get_rows(1)[:rows][0]

          if r.nil?
            return false if !config['required']
            break
          end

          fr = {}
          ds.visible_columns.each {|c| fr[c.fieldName] = r[c.id.to_s]}
          available_contexts[id] = {id: id, type: config['type'], row: fr}
        end
      end
      return true
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
          return !config['required'] if context[:dataset].blank?
          ds = context[:dataset].deep_clone(View)
        else
          @@pending_contexts ||= {}
          @@pending_contexts[config['contextId']] ||= []
          @@pending_contexts[config['contextId']] << {config: config, callback: callback}
        end
      elsif !config['datasetId'].blank?
        begin
          ds = View.find(config['datasetId'])
        rescue CoreServer::ResourceNotFound
          return false if config['required']
        rescue CoreServer::CoreServerError
          return false if config['required']
        end
      elsif !config['search'].blank?
        search_response = Clytemnestra.search_views(config['search'].merge({'limit' => 1}))
        ds = search_response.results.first
        return false if ds.nil? && config['required']
      end
      if !ds.blank?
        got_dataset(ds, config)
        yield(ds)
      end
      return true
    end

    def self.got_dataset(ds, config)
      add_query(ds, config['query'])
      ds.data['totalRows'] = ds.get_total_rows if config['getTotal']
    end
  end
end
