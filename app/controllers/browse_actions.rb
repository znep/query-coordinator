module BrowseActions
  include ApplicationHelper

protected
  def view_types_facet
    vts = {
      :title => 'View Types',
      :singular_description => 'type',
      :param => :limitTo,
      :use_icon => true,
      :options => [
        {:text => 'Datasets', :value => 'datasets', :class => 'typeBlist'},
        {:text => 'External Datasets', :value => 'href', :class => 'typeHref'},
        {:text => 'Files and Documents', :value => 'blob', :class => 'typeBlob'},
        {:text => 'Filtered Views', :value => 'filters', :class => 'typeFilter'},
        {:text => 'Charts', :value => 'charts', :class => 'typeChart'},
        {:text => 'Maps', :value => 'maps', :class => 'typeMap'},
        {:text => 'Calendars', :value => 'calendars', :class => 'typeCalendar'},
        {:text => 'Forms', :value => 'forms', :class => 'typeForm'}]
    }
    view_types = CurrentDomain.property(:view_types_facet, :catalog)
    return vts if view_types.nil?
    vts[:options].select!{ |opt| view_types.include?(opt[:value]) }
    vts
  end

  def categories_facet
    cats = View.categories.keys.reject {|c| c.blank?}
    return nil if cats.length < 1
    cats = cats.sort.map{ |c| {:text => c, :value => c} }
    if cats.length > 5
      cats, hidden_cats = cats[0..4], cats
    end
    return { :title => 'Categories',
      :singular_description => 'category',
      :param => :category,
      :options => cats,
      :extra_options => hidden_cats
    }
  end

  def topics_facet
    all_tags = Tag.find({:method => "viewsTags"})
    top_tags = all_tags.slice(0, 5).map {|t| t.name}
    if !params[:tags].nil? && !top_tags.include?(params[:tags])
      top_tags.push(params[:tags])
    end
    top_tags = top_tags.sort.map {|t| {:text => t, :value => t}}
    tag_cloud = nil
    if all_tags.length > 5
      tag_cloud = all_tags.sort_by {|t| t.name}.
        map {|t| {:text => t.name, :value => t.name, :count => t.frequency}}
    end

    { :title => 'Topics',
      :singular_description => 'topic',
      :param => :tags,
      :options => top_tags,
      :extra_options => tag_cloud
    }
  end

  def federated_facet
    all_feds = Federation.find.
      select {|f| f.targetDomainCName == CurrentDomain.cname &&
        f.lensName.empty? && f.acceptedUserId.present?}.
      sort_by {|f| f.sourceDomainCName}.
      map {|f| {:text => f.sourceDomainCName, :value => f.sourceDomainId.to_s,
        :icon => {:type => 'static', :href => "/api/domains/#{f.sourceDomainCName}/icons/smallIcon"}} }
    return nil if all_feds.length < 1

    all_feds.unshift({:text => 'This site only', :value => CurrentDomain.domain.id.to_s,
        :icon => {:type => 'static', :href => "/api/domains/#{CurrentDomain.cname}/icons/smallIcon"}})
    top_feds = all_feds.slice(0, 5)
    fed_cloud = nil
    if all_feds.length > 5
      fed_cloud = all_feds
    end

    { :title => 'Federated Domains',
      :singular_description => 'domain',
      :param => :federation_filter,
      :options => top_feds,
      :extra_options => fed_cloud
    }
  end

  def moderation_facet
    { :title => 'Moderation Status',
      :singular_description => 'moderation',
      :param => :moderation,
      :options => [
        {:text => 'Pending', :value => 'pending'},
        {:text => 'Approved', :value => 'accepted'},
        {:text => 'Rejected', :value => 'rejected'}
      ]
    }
  end

  def extents_facet
    return nil if !CurrentDomain.module_enabled?(:esri_integration)
    { :title => 'Within Geographical Area',
      :param => :extents,
      :custom_content => proc do |params, opts|
        html = "<a href='#ChooseBounds' class='chooseBounds'>"
        if !params[:extents].blank?
          html += extent_html(opts[:ymax], opts[:xmin], opts[:ymin], opts[:xmax])
        end
        html += "Set geographical area</a>"
        html
      end,
      :custom_description => proc do |params, opts|
          return nil if params[:extents].nil?
          "within an area"
      end
    }
  end

  def custom_facets
    facets = CurrentDomain.property(:facets, :catalog)
    return if facets.nil?
    facets.map do |facet|
      if facet.options && facet.options.length > 5
        facet.options, facet.extra_options = facet.options.partition{ |opt| opt.summary }
        if facet.options.length < 1
          facet.options = facet.extra_options[0..4]
        end
        facet.extra_options_class = "padMore"
      end
      facet
    end
  end

  def process_browse!(options = {})
    browse_params = (options[:force_default]) ? {} : params
    cfg = CurrentDomain.configuration('catalog')
    cfg_props = cfg ? cfg.properties : Hashie::Mash.new

    @port = request.port
    @limit ||= (cfg_props.results_per_page ? cfg_props.results_per_page.to_i : 10)
    @disable ||= {}
    @opts ||= {}
    @opts.merge!({:limit => @limit, :page => (browse_params[:page] || 1).to_i})
    @ignore_params ||= ['controller', 'action']
    @params = browse_params.reject {|k, v| @ignore_params.include? k.to_s}
    @default_params ||= CurrentDomain.property(:default_params, :catalog) || {}
    @default_params.delete(params[:no_default].to_sym) if !params[:no_default].nil?
    @default_params.each { |k, v| browse_params[k.to_sym] = v if browse_params[k].nil? }
    @no_results_text ||= 'No Results'
    @base_url ||= request.path

    # Whether or not we need to display icons for other domains
    @use_federations = @opts[:nofederate] == 'true' ? false :
      Federation.find.select {|f| f.acceptedUserId.present? &&
        f.sourceDomainCName != CurrentDomain.cname }.
        length > 0 if @use_federations.nil?

    @view_type ||= browse_params['viewType'] || cfg_props.default_view_type || 'table'
    @grid_items = @view_type == 'rich' ?
      {:largeImage => true, :richSection => true, :popularity => true, :type => true, :rss => true} :
      {:index => true, :domainIcon => @use_federations, :nameDesc => true,
        :datasetActions => @dataset_actions, :popularity => true, :type => true}

    if cfg_props.facet_dependencies
      @strip_params = {}
      cfg_props.facet_dependencies.each do |dep|
        dep.each do |member|
          dep.each do |subm|
            @strip_params[subm.to_sym] ||= {}
            @strip_params[subm.to_sym][member.to_sym] = true
          end
        end
      end
    end

    cfs = custom_facets
    if cfs
      cfs.each do |facet|
        if browse_params[facet.param]
          @opts[:metadata_tag] ||= []
          @opts[:metadata_tag] << facet.param + ":" + browse_params[facet.param]
        end
      end
    end

    # Simple params; these are copied directly to opts
    [:sortBy, :category, :tags, :moderation, :q, :federation_filter].each do |p|
      if !browse_params[p].nil?
        @opts[p] = browse_params[p]
      end
    end

    if !browse_params[:limitTo].nil?
      case browse_params[:limitTo]
      when 'datasets'
        @opts[:limitTo] = 'tables'
        @opts[:datasetView] = 'dataset'
      when 'filters'
        @opts[:limitTo] = 'tables'
        @opts[:datasetView] = 'view'
      else
        @opts[:limitTo] = browse_params[:limitTo]
      end
    end

    if !browse_params[:sortPeriod].nil?
      t = Date.today
      @opts[:sortPeriod] = case browse_params[:sortPeriod]
                          when 'week'
                            "WEEKLY"
                          when 'month'
                            "MONTHLY"
                          when 'year'
                            "YEARLY"
                          end
    end

    if !browse_params[:extents].nil?
      extents = browse_params[:extents].split(',')
      if extents.length == 4
        @opts[:xmin] = extents.shift
        @opts[:xmax] = extents.shift
        @opts[:ymin] = extents.shift
        @opts[:ymax] = extents.shift
      end
    end

    @facets ||= [
      view_types_facet,
      cfs,
      categories_facet,
      topics_facet,
      federated_facet,
      extents_facet
    ]
    @facets = @facets.compact.flatten.reject{ |f| f[:hidden] }

    if @suppressed_facets.is_a? Array
      @facets.select!{ |facet| !(@suppressed_facets.include? facet[:singular_description]) }
    end

    @sidebar_config = cfg_props.sidebar
    @header_config  = cfg_props.header
    @footer_config  = cfg_props.footer

    @sort_opts ||= @@default_browse_sort_opts

    if @view_results.nil?
      @view_results = SearchResult.search('views', @opts)[0]
      @view_count = @view_results.count
      @view_results = @view_results.results
    end

    @title ||= get_title(@params, @opts, @facets)
  end

  @@default_browse_sort_opts = [
    {:value => 'relevance', :name => 'Most Relevant'},
    {:value => 'most_accessed', :name => 'Most Accessed',
      :is_time_period => true},
    {:value => 'alpha', :name => 'Alphabetical'},
    {:value => 'newest', :name => 'Newest'},
    {:value => 'oldest', :name => 'Oldest'},
    {:value => 'rating', :name => 'Highest Rated'},
    {:value => 'comments', :name => 'Most Comments'}
  ]

private
  def get_title(params, opts, facets)
    t = String.new

    t = 'for "' + CGI.escapeHTML(params[:q]) + '"' if !params[:q].blank?
    parts = []
    facets.each do |f|
      if !params[f[:param]].blank?
        if !f[:singular_description].blank?
          facet_item = f[:options].detect {|o| o[:value] == params[f[:param]]}
          parts << f[:singular_description] + ' of ' + facet_item[:text] unless facet_item.nil?
        elsif !f[:custom_description].blank?
          parts << f[:custom_description].call(params, opts)
        end
      end
    end
    if parts.length > 0
      p = [parts.slice(0, parts.length - 1).join(', '), parts[-1]].
        reject {|a| a.empty?}.join(' and ')
      if !p.blank?
        t += ', ' if !t.blank?
        t += 'matching ' + p
      end
    end

    t.blank? ? (CurrentDomain.property(:default_title, :catalog) ||
                 'Search & Browse Datasets and Views') : 'Results ' + t
  end

end
