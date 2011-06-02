module BrowseActions
  include ApplicationHelper

protected
  attr_reader :request_params

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
    params = params || request_params || {}

    cats = View.categories.keys.reject {|c| c.blank?}
    return nil if cats.empty?

    cats = cats.sort.map{ |c| {:text => c, :value => c} }
    cats, hidden_cats = cats[0..4], cats if cats.length > 5

    if params[:category].present? && !cats.any?{ |cat| cat[:text] == params[:category] }
      cats.push({ :text => params[:category], :value => params[:category] })
    end

    return { :title => 'Categories',
      :singular_description => 'category',
      :param => :category,
      :options => cats,
      :extra_options => hidden_cats
    }
  end

  def topics_facet
    params = params || request_params || {}

    all_tags = Tag.find({:method => "viewsTags"})
    top_tags = all_tags.slice(0, 5).map {|t| t.name}
    if params[:tags].present? && !top_tags.include?(params[:tags])
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
    params = params || request_params || {}

    return nil unless CurrentDomain.module_enabled?(:esri_integration)
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
      :custom_description => proc do |options|
        options[:extents].nil? ? nil : "within an area"
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

  def process_browse(request, options = {})
    # some of the other methods need this
    @request_params = request.params

    # grab our catalog configuration first
    catalog_config = CurrentDomain.configuration('catalog')
    catalog_config = catalog_config ? catalog_config.properties : Hashie::Mash.new

    # grab the user's params unless we're forcing default
    if options[:force_default]
      user_params = {}
    else
      user_params = request.params.dup.to_hash
      user_params.deep_symbolize_keys!
    end

    # grab configured params
    configured_params = (catalog_config.default_params || {}).to_hash
    configured_params.deep_symbolize_keys!

    # next deal with options
    default_options = {
      limit: 10,
      page: 1,
      port: request.port,
      disable: {},
      no_results_text: 'No Results',
      base_url: request.path,
      view_type: 'table'
    }

    configured_options = catalog_config.to_hash
    configured_options.deep_symbolize_keys!
    configured_options.delete(:default_params)

    browse_options = default_options
                       .merge(configured_options) # whatever they configured is somewhat important
                       .merge(options)            # whatever the call configures is more important
                       .merge(configured_params)  # gives the domain a chance to override the call
                       .merge(user_params)        # anything from the queryparam is most important

    # munge params to types we expect
    @@numeric_options.each do |option|
      browse_options[option] = browse_options[option].to_i if browse_options[option].present?
      user_params[option] = user_params[option].to_i if user_params[option].present?
    end
    @@boolean_options.each do |option|
      browse_options[option] = (browse_options[option] == 'true') ||
                               (browse_options[option] == true) if browse_options[option].present?
      user_params[option] = (user_params[option] == 'true') ||
                            (user_params[option] == true) if user_params[option].present?
    end

    # for core server quirks
    search_options = {}



    # check whether or not we need to display icons for other domains
    browse_options[:use_federations] = browse_options[:nofederate] ? false :
      Federation.find.any?{ |f| f.acceptedUserId.present? &&
        f.sourceDomainCName != CurrentDomain.cname } if browse_options[:use_federations].nil?

    # set up which grid columns to display if we don't have one already
    browse_options[:grid_items] ||=
      case browse_options[:view_type]
      when 'rich'
        { largeImage: true, richSection: true, popularity: true, type: true, rss: true }
      else
        { index: true, domainIcon: browse_options[:use_federations], nameDesc: true,
          datasetActions: browse_options[:dataset_actions], popularity: true, type: true }
      end

    if catalog_config.facet_dependencies
      browse_options[:strip_params] = {}
      catalog_config.facet_dependencies.each do |dep|
        dep.each do |member|
          dep.each do |subm|
            browse_options[:strip_params][subm.to_sym] ||= {}
            browse_options[:strip_params][subm.to_sym][member.to_sym] = true
          end
        end
      end
    end

    cfs = custom_facets
    if cfs
      cfs.each do |facet|
        if browse_options[facet.param]
          browse_options[:metadata_tag] ||= []
          browse_options[:metadata_tag] << facet.param + ":" + browse_options[facet.param]
        end
      end
    end

    if browse_options[:limitTo].present?
      case browse_options[:limitTo]
      when 'unpublished'
        search_options[:limitTo] = 'tables'
        search_options[:datasetView] = 'dataset'
        search_options[:publication_stage] = 'unpublished'
      when 'datasets'
        search_options[:limitTo] = 'tables'
        search_options[:datasetView] = 'dataset'
      when 'filters'
        search_options[:limitTo] = 'tables'
        search_options[:datasetView] = 'view'
      end
    end

    if browse_options[:sortPeriod].present?
      t = Date.today
      browse_options[:sortPeriod] =
        case browse_options[:sortPeriod]
        when 'week'
          'WEEKLY'
        when 'month'
          'MONTHLY'
        when 'year'
          'YEARLY'
        else
          browse_options[:sortPeriod]
        end
    end

    if browse_options[:extents].present?
      extents = browse_options[:extents]
      if extents.is_a? String
        extents = extents.split(',')
        if extents.length == 4
          browse_options[:xmin] = extents.shift
          browse_options[:xmax] = extents.shift
          browse_options[:ymin] = extents.shift
          browse_options[:ymax] = extents.shift
        end
      end
    end

    browse_options[:facets] ||= [
      view_types_facet,
      cfs,
      categories_facet,
      topics_facet,
      federated_facet,
      extents_facet
    ]
    browse_options[:facets] = browse_options[:facets].compact.flatten.reject{ |f| f[:hidden] }

    if browse_options[:suppressed_facets].is_a? Array
      browse_options[:facets].reject! do |facet|
        browse_options[:suppressed_facets].include? facet[:singular_description]
      end
    end

    browse_options[:sidebar_config] = catalog_config.sidebar
    browse_options[:header_config]  = catalog_config.header
    browse_options[:footer_config]  = catalog_config.footer

    browse_options[:sort_opts] ||= @@default_browse_sort_opts
    browse_options[:disable] = {} unless browse_options[:disable].present?

    # get the subset relevant to various things
    browse_options[:search_options] = browse_options.select{ |k| @@search_options.include? k }
                                                    .merge(search_options)
    ignore_params = (browse_options[:ignore_params] || []) + [ :controller, :action, :page ]
    browse_options[:user_params] = user_params.reject{ |k| ignore_params.include? k }

    if browse_options[:view_results].nil?
      view_results = SearchResult.search('views', browse_options[:search_options])[0]
      browse_options[:view_count] = view_results.count
      browse_options[:view_results] = view_results.results
    end

    browse_options[:title] ||= get_title(browse_options, browse_options[:facets])

    return browse_options
  end

private
  def get_title(options, facets)
    t = String.new

    t = 'for "' + CGI.escapeHTML(options[:q]) + '"' if !options[:q].blank?
    parts = []
    facets.each do |f|
      if !options[f[:param]].blank?
        if !f[:singular_description].blank?
          facet_item = f[:options].detect {|o| o[:value] == options[f[:param]]}
          parts << f[:singular_description] + ' of ' + facet_item[:text] unless facet_item.nil?
        elsif !f[:custom_description].blank?
          parts << f[:custom_description].call(options)
        end
      end
    end
    unless parts.empty?
      p = parts.compact.to_sentence
      unless p.blank?
        t += ', ' unless t.blank?
        t += 'matching ' + p
      end
    end

    t.blank? ? 'Search & Browse Datasets and Views' : 'Results ' + t
  end

  @@default_browse_sort_opts = [
    { value: 'relevance', name: 'Most Relevant' },
    { value: 'most_accessed', name: 'Most Accessed', is_time_period: true },
    { value: 'alpha', name: 'Alphabetical' },
    { value: 'newest', name: 'Newest' },
    { value: 'oldest', name: 'Oldest' },
    { value: 'rating', name: 'Highest Rated' },
    { value: 'comments', name: 'Most Comments' }
  ]

  @@numeric_options = [ :limit, :page ]
  @@boolean_options = [ :nofederate ]

  @@search_options = [ :id, :name, :tags, :desc, :q, :category, :limit, :page, :sortBy, :limitTo, :for_user, :datasetView, :sortPeriod, :admin, :nofederate, :moderation, :xmin, :ymin, :xmax, :ymax, :for_approver, :approval_stage_id, :publication_stage, :federation_filter, :metadata_tag ]
  @@querystring_options = [  ]
end
