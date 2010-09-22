# note: this is not a real controller! It just provides mixin methods.

module BrowseController

protected
  def view_types_facet
    { :title => 'View Types',
      :param => :limitTo,
      :use_icon => true,
      :options => [
        {:text => 'Datasets', :value => 'datasets', :class => 'typeBlist'},
        {:text => 'Filtered Views', :value => 'filters', :class => 'typeFilter'},
        {:text => 'Charts', :value => 'charts', :class => 'typeVisualization'},
        {:text => 'Maps', :value => 'maps', :class => 'typeMap'},
        {:text => 'Calendars', :value => 'calendars', :class => 'typeCalendar'},
        {:text => 'Forms', :value => 'forms', :class => 'typeForm'}]
    }
  end

  def categories_facet
    { :title => 'Categories',
      :param => :category,
      :options => View.categories.keys.reject {|c| c.blank?}.sort.
        map { |c| {:text => c, :value => c} }
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
      :param => :tags,
      :options => top_tags,
      :extra_options => tag_cloud
    }
  end

  def process_browse!
    @opts ||= {}
    @opts.merge!({:limit => 10, :page => (params[:page] || 1).to_i})
    (@default_params || {}).each { |k, v| params[k] = v if params[k].nil? }
    @params = params.reject {|k, v| k == 'controller' || k == 'action'}
    @base_url ||= request.env['REQUEST_PATH']

    # Simple params; these are copied directly to opts
    [:sortBy, :category, :tags].each do |p|
      if !params[p].nil?
        @opts[p] = params[p]
      end
    end

    if !params[:limitTo].nil?
      case params[:limitTo]
      when 'datasets'
        @opts[:limitTo] = 'tables'
        @opts[:datasetView] = 'dataset'
      when 'filters'
        @opts[:limitTo] = 'tables'
        @opts[:datasetView] = 'view'
      else
        @opts[:limitTo] = params[:limitTo]
      end
    end

    if !params[:sortPeriod].nil?
      t = Date.today
      @opts[:endDate] = t.to_s
      @opts[:startDate] = case params[:sortPeriod]
                          when 'week'
                            Date.commercial(t.cwyear, t.cweek, 1)
                          when 'month'
                            Date.civil(t.year, t.month, 1)
                          when 'year'
                            Date.civil(t.year, 1, 1)
                          end.to_s
    end

    if !params[:q].nil?
      @opts[:q] = params[:q]
    else
      # Terrible hack; but search service needs _something_ non-null; so we'll
      # search for everything!
      @opts[:q] = "''"
    end

    @facets ||= [
      view_types_facet,
      categories_facet,
      topics_facet
    ]

    @sort_opts ||= [
      {:value => 'relevance', :name => 'Most Relevant'},
      {:value => 'most_accessed', :name => 'Most Accessed',
        :is_time_period => true},
      {:value => 'newest', :name => 'Newest'},
      {:value => 'oldest', :name => 'Oldest'},
      {:value => 'rating', :name => 'Highest Rated'},
      {:value => 'comments', :name => 'Most Comments'},
    ]

    if @view_results.nil?
      @view_results = SearchResult.search('views', @opts)[0]
      @view_count = @view_results.count
      @view_results = @view_results.results
    end
  end

end
