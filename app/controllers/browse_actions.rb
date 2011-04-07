module BrowseActions
  include ApplicationHelper

protected
  def view_types_facet
    { :title => 'View Types',
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
  end

  def categories_facet
    cats = View.categories.keys.reject {|c| c.blank?}
    return nil if cats.length < 1
    return { :title => 'Categories',
      :singular_description => 'category',
      :param => :category,
      :options => cats.sort.map { |c| {:text => c, :value => c} }
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
          return "within an area"
      end
    }
  end

  def process_browse!(options = {})
    browse_params = (options[:force_default]) ? {} : params

    @port = request.port
    @limit ||= 10
    @disable ||= {}
    @opts ||= {}
    @opts.merge!({:limit => @limit, :page => (browse_params[:page] || 1).to_i})
    @params = browse_params.reject {|k, v| k.to_s == 'controller' || k.to_s == 'action'}
    @default_params ||= {}
    @default_params.delete(params[:no_default].to_sym) if !params[:no_default].nil?
    @default_params.each { |k, v| browse_params[k] = v if browse_params[k].nil? }
    @no_results_text ||= 'No Results'
    @base_url ||= request.path

    # Simple params; these are copied directly to opts
    [:sortBy, :category, :tags, :moderation].each do |p|
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

    if !browse_params[:q].nil?
      @opts[:q] = browse_params[:q]
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
      categories_facet,
      topics_facet,
      extents_facet
    ]
    @facets.compact!

    @sort_opts ||= @@default_browse_sort_opts

    if @view_results.nil?
      @view_results = SearchResult.search('views', @opts)[0]
      @view_count = @view_results.count
      @view_results = @view_results.results
    end

    # Whether or not we need to display icons for other domains
    @use_federations = Federation.find.
      select {|f| f.acceptedUserId.present? &&
        f.sourceDomainCName != CurrentDomain.cname }.
        length > 0 if @use_federations.nil?

    @title = get_title(@params, @opts, @facets)
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

    t.blank? ? 'Search & Browse Datasets and Views' : 'Results ' + t
  end

end
