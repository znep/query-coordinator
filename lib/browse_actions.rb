# encoding: utf-8

module BrowseActions
  include ActionView::Helpers::TranslationHelper
  include ApplicationHelper

protected
  attr_reader :request_params

  def view_types_facet
    vts = {
      :title => t('controls.browse.facets.view_types_title'),
      :singular_description => t('controls.browse.facets.view_types_singular_title'),
      :param => :limitTo,
      :use_icon => true,
      :options => [
        {:text => t('controls.browse.facets.view_types.datasets'), :value => 'datasets', :class => 'typeBlist'},
        {:text => t('controls.browse.facets.view_types.charts'), :value => 'charts', :class => 'typeChart'},
        {:text => t('controls.browse.facets.view_types.maps'), :value => 'maps', :class => 'typeMap'},
        {:text => t('controls.browse.facets.view_types.calendars'), :value => 'calendars', :class => 'typeCalendar'},
        {:text => t('controls.browse.facets.view_types.filters'), :value => 'filters', :class => 'typeFilter'},
        {:text => t('controls.browse.facets.view_types.href'), :value => 'href', :class => 'typeHref'},
        {:text => t('controls.browse.facets.view_types.blob'), :value => 'blob', :class => 'typeBlob'},
        {:text => t('controls.browse.facets.view_types.forms'), :value => 'forms', :class => 'typeForm'}]
    }
    if (module_available?(:api_foundry))
      vts[:options] << {:text => t('controls.browse.facets.view_types.apis'), :value => 'apis', :class => 'typeApi'}
    end
    view_types = CurrentDomain.property(:view_types_facet, :catalog)
    return vts if view_types.nil?
    vts[:options].select!{ |opt| view_types.include?(opt[:value]) }
    vts
  end

  def categories_facet(params = nil)
    params = params || request_params || {}

    cats = View.category_tree.reject { |c, o| c.blank? }
    return nil if cats.empty?

    cat_chop = get_facet_cutoff(:category)
    cats = cats.values.sort_by { |o| o[:value] }
    cats, hidden_cats = cats[0..(cat_chop - 1)], cats[cat_chop..-1] if cats.length > cat_chop

    if params[:category].present? && !cats.any? { |cat| cat[:value] == params[:category] ||
      (cat[:children] || []).any? { |cc| cc[:value] == params[:category] } }
      found_cat = (hidden_cats || []).detect { |cat| cat[:value] == params[:category] ||
        (cat[:children] || []).any? { |cc| cc[:value] == params[:category] } }
      if found_cat.nil?
        cats.push({ :text => params[:category], :value => params[:category] })
      else
        cats.push(found_cat)
        hidden_cats.delete(found_cat)
      end
    end

    return { :title => t('controls.browse.facets.categories_title'),
      :singular_description => t('controls.browse.facets.categories_singular_title'),
      :param => :category,
      :options => cats,
      :extra_options => hidden_cats
    }
  end

  def topics_facet(params = nil)
    params = params || request_params || {}

    topic_chop = get_facet_cutoff(:topic)
    all_tags = Tag.find({:method => "viewsTags"})
    top_tags = all_tags.slice(0, topic_chop).map {|t| t.name}
    if params[:tags].present? && !top_tags.include?(params[:tags])
      top_tags.push(params[:tags])
    end
    top_tags = top_tags.sort.map {|t| {:text => t, :value => t}}
    tag_cloud = nil
    if all_tags.length > topic_chop
      tag_cloud = all_tags.sort_by {|t| t.name}.
        map {|t| {:text => t.name, :value => t.name, :count => t.frequency}}
    end

    { :title => t('controls.browse.facets.topics_title'),
      :singular_description => t('controls.browse.facets.topics_singular_title'),
      :param => :tags,
      :options => top_tags,
      :extra_options => tag_cloud,
      :tag_cloud => true
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

    fed_chop = get_facet_cutoff(:federation)
    all_feds.unshift({:text => 'This site only', :value => CurrentDomain.domain.id.to_s,
        :icon => {:type => 'static', :href => "/api/domains/#{CurrentDomain.cname}/icons/smallIcon"}})
    top_feds = all_feds.slice(0, fed_chop)
    fed_cloud = nil
    if all_feds.length > fed_chop
      fed_cloud = all_feds[fed_chop..-1]
    end

    { :title => t('controls.browse.facets.federated_domains_title'),
      :singular_description => t('controls.browse.facets.federated_domains_singular_title'),
      :param => :federation_filter,
      :options => top_feds,
      :extra_options => fed_cloud
    }
  end

  def moderation_facet
    { :title => t('controls.browse.facets.moderation_status_title'),
      :singular_description => t('controls.browse.facets.moderation_status_singular_title'),
      :param => :moderation,
      :options => [
        {:text => t('controls.browse.facets.moderation_status.pending'), :value => 'pending'},
        {:text => t('controls.browse.facets.moderation_status.accepted'), :value => 'accepted'},
        {:text => t('controls.browse.facets.moderation_status.rejected'), :value => 'rejected'}
      ]
    }
  end

  def custom_facets
    facets = CurrentDomain.property(:custom_facets, :catalog)

    return if facets.nil?
    custom_chop = get_facet_cutoff(:custom)
    facets.map do |facet|
      facet.param = facet.param.to_sym

      if facet.options && facet.options.length > custom_chop
        facet.options, facet.extra_options = facet.options.partition{ |opt| opt.summary }
        if facet.options.empty?
          facet.options = facet.extra_options.slice!(0..(custom_chop - 1))
        end
      end
      facet.with_indifferent_access
    end
  end

  def get_facet_cutoff(facet_name)
    if @@cutoff_store[CurrentDomain.cname].nil?
      domain_cutoffs = CurrentDomain.property(:facet_cutoffs, :catalog) || {}
      translated_cutoffs = domain_cutoffs.inject({}) do |collect, (key, value)|
        collect[key.to_sym] = value.to_i
        collect
      end
      @@cutoff_store[CurrentDomain.cname] = @@default_cutoffs.merge(translated_cutoffs)
    end
    @@cutoff_store[CurrentDomain.cname][facet_name]
  end

  def process_browse(request, options = {})
    # some of the other methods need this
    @request_params = request.params

    # make our params all safe
    @request_params.fix_get_encoding!

    # grab our catalog configuration first
    catalog_config = CurrentDomain.configuration('catalog')
    if catalog_config
      catalog_config = catalog_config.properties.merge!(catalog_config.strings)
    else
      catalog_config = Hashie::Mash.new
    end

    # grab the user's params unless we're forcing default
    if options[:force_default]
      user_params = {}
    else
      user_params = request.params.dup.to_hash.deep_symbolize_keys
    end

    # grab configured params
    configured_params = (catalog_config.default_params || {}).to_hash.deep_symbolize_keys

    # deal with default base_url wrt localization (ergghhhh bad hack.)
    base_url = request.path
    base_url = '/' + I18n.locale.to_s + base_url if I18n.locale.to_s != CurrentDomain.default_locale

    # next deal with options
    default_options = {
      limit: 10,
      page: 1,
      port: request.port,
      disable: {},
      no_results_text: t('controls.browse.listing.no_results'),
      timeout_text: t('controls.browse.listing.timeout'),
      base_url: base_url,
      view_type: 'table'
    }

    configured_options = catalog_config.to_hash.deep_symbolize_keys
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
        if browse_options[facet[:param]]
          browse_options[:metadata_tag] ||= []
          browse_options[:metadata_tag] << facet[:param].to_s + ":" + browse_options[facet[:param]]
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
      search_options[:sortPeriod] =
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

    browse_options[:facets] ||= [
      view_types_facet,
      cfs,
      categories_facet,
      topics_facet,
      federated_facet
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

    browse_options[:sort_opts] ||= default_browse_sort_opts
    browse_options[:disable] = {} unless browse_options[:disable].present?

    # get the subset relevant to various things
    browse_options[:search_options] = browse_options.select{ |k| @@search_options.include? k }
                                                    .merge(search_options)
    ignore_params = (browse_options[:ignore_params] || []) + [ :controller, :action, :page ]
    browse_options[:user_params] = user_params.reject{ |k| ignore_params.include? k }

    # insert utf8 snowman thing
    browse_options[:user_params][:utf8] = '✓'

    # Don't get rows in search, just in JS
    browse_options[:row_count] = browse_options[:search_options].delete(:row_count)

    if browse_options[:view_results].nil? || browse_options[:view_results].empty?
      Rails.logger.info("IT WAS AN EMPTY ARRAY") unless browse_options[:view_results].nil?
      begin
        view_results = Clytemnestra.search_views(browse_options[:search_options])
        browse_options[:view_count] = view_results.count
        browse_options[:view_results] = view_results.results
      rescue CoreServer::TimeoutError
        Rails.logger.warn("Timeout on Clytemnestra request for #{browse_options.to_json}")
        browse_options[:view_request_timed_out] = true
        browse_options[:view_results] = []
      end
    end

    # check whether or not we need to display icons for other domains
    browse_options[:use_federations] = browse_options[:nofederate] ? false :
      browse_options[:view_results].any?{ |v| v.federated? } if browse_options[:use_federations].nil?

    # set up which grid columns to display if we don't have one already
    browse_options[:grid_items] ||=
      case browse_options[:view_type]
      when 'rich'
        { largeImage: true, richSection: true, popularity: true, type: true, rss: true }
      else
        { index: true, domainIcon: browse_options[:use_federations], nameDesc: true,
          datasetActions: browse_options[:dataset_actions], popularity: true, type: true }
      end

    browse_options[:title] ||= get_title(browse_options, browse_options[:facets])

    return browse_options.with_indifferent_access
  end

private
  def get_title(options, facets)
    title = []

    title << t('controls.browse.title.result.term', :term => options[:q]) unless options[:q].blank?
    facet_parts = []
    facets.each do |f|
      if !options[f[:param]].blank?
        if !f[:singular_description].blank?
          facet_item = nil
          f[:options].each do |o|
            if o[:value] == options[f[:param]]
              facet_item = o
            elsif !o[:children].nil?
              facet_item = o[:children].detect { |c| c[:value] == options[f[:param]] }
            end
          end
          facet_parts << t('controls.browse.title.result.facet',
                           :facet_type => f[:singular_description],
                           :facet_value => facet_item[:text]) unless facet_item.nil?
        elsif !f[:custom_description].blank?
          facet_parts << f[:custom_description].call(options)
        end
      end
    end
    title << t('controls.browse.title.result.facet_main',
               :body => facet_parts.compact.to_sentence) unless facet_parts.empty?

    if title.empty?
      options[:default_title] || t('controls.browse.title.default')
    else
      t('controls.browse.title.result.main', :body => title.join(', '))
    end.to_str # force this string to be marked html unsafe
  end

  def default_browse_sort_opts
    [
      { value: 'relevance', name: t('controls.browse.sorts.relevance') },
      { value: 'most_accessed', name: t('controls.browse.sorts.most_accessed'), is_time_period: true },
      { value: 'alpha', name: t('controls.browse.sorts.alpha') },
      { value: 'newest', name: t('controls.browse.sorts.newest') },
      { value: 'oldest', name: t('controls.browse.sorts.oldest') },
      { value: 'last_modified', name: t('controls.browse.sorts.last_modified') },
      { value: 'rating', name: t('controls.browse.sorts.rating') },
      { value: 'comments', name: t('controls.browse.sorts.comments') }
    ]
  end

  # Unused for now, but this will refresh the cutoffs from the configs service
  def self.clear_cutoff_cache(cname = nil)
    @@cutoff_store.delete(cname || CurrentDomain.cname)
  end

  @@default_cutoffs = {
    :custom => 5,
    :category => 5,
    :federation => 5,
    :topic => 5
  }
  @@cutoff_store = {}

  @@numeric_options = [ :limit, :page ]
  @@boolean_options = [ :nofederate ]

  @@moderatable_types = [ 'filters', 'charts', 'maps', 'calendars', 'forms' ]

  @@search_options = [ :id, :name, :tags, :desc, :q, :category, :limit, :page, :sortBy, :limitTo, :for_user, :datasetView, :sortPeriod, :admin, :nofederate, :moderation, :xmin, :ymin, :xmax, :ymax, :for_approver, :approval_stage_id, :publication_stage, :federation_filter, :metadata_tag, :row_count ]
  @@querystring_options = [  ]
end
