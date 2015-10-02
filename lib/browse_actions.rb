# encoding: utf-8

module BrowseActions
  include ActionView::Helpers::TranslationHelper
  include ApplicationHelper

  protected

  attr_reader :request_params

  def cetera_search_enabled?
    FeatureFlags.derive(nil, defined?(request) ? request : nil)[:cetera_search]
  end

  def using_cetera?
    request_params.present? &&
      request_params[:cetera_search].present? &&
      cetera_search_enabled? &&
      APP_CONFIG.cetera_host.present? &&
      User.current_user.nil?
  end

  def standard_view_types
    [
      { text: t('controls.browse.facets.view_types.datasets'), value: 'datasets', class: 'typeBlist' },
      { text: t('controls.browse.facets.view_types.charts'), value: 'charts', class: 'typeChart' },
      { text: t('controls.browse.facets.view_types.maps'), value: 'maps', class: 'typeMap' },
      { text: t('controls.browse.facets.view_types.calendars'), value: 'calendars', class: 'typeCalendar' },
      { text: t('controls.browse.facets.view_types.filters'), value: 'filters', class: 'typeFilter' },
      { text: t('controls.browse.facets.view_types.href'), value: 'href', class: 'typeHref' },
      { text: t('controls.browse.facets.view_types.blob'), value: 'blob', class: 'typeBlob' },
      { text: t('controls.browse.facets.view_types.forms'), value: 'forms', class: 'typeForm' }
    ]
  end

  def cetera_view_types
    # These are FE values, not translated into Cetera types
    supported_core_objects = %w(datasets maps blob href).to_set

    standard_view_types.select do |view_type|
      supported_core_objects.include? view_type[:value]
    end
  end

  def base_view_types_facet
    {
      title: t('controls.browse.facets.view_types_title'),
      singular_description: t('controls.browse.facets.view_types_singular_title'),
      param: :limitTo,
      use_icon: true
    }
  end

  def view_types_facet
    view_types = using_cetera? ? cetera_view_types : standard_view_types

    add_data_lens_view_type_if_enabled!(view_types) unless using_cetera?
    add_stories_view_type_if_enabled!(view_types) unless using_cetera?
    add_pulse_view_type_if_enabled!(view_types) unless using_cetera?

    if module_enabled?(:api_foundry)
      view_types <<
        { text: t('controls.browse.facets.view_types.apis'), value: 'apis', class: 'typeApi' }
    end

    whitelisted_view_types = CurrentDomain.property(:view_types_facet, :catalog)
    if whitelisted_view_types # WARN: if you leave this an empty array, no view types!
      view_types.select! { |vt| whitelisted_view_types.include?(vt) }
    end

    base_view_types_facet.merge(options: view_types)
  end

  def categories_facet(params = nil)
    params = params || request_params || {}

    cats = View.category_tree.reject { |c, _| c.blank? }
    return nil if cats.empty?

    cat_chop = get_facet_cutoff(:category)
    cats = cats.values.sort_by { |o| o[:value] }
    cats, hidden_cats = cats[0..(cat_chop - 1)], cats[cat_chop..-1] if cats.length > cat_chop

    # This logic is unreadable
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

  def federations_hash
    @federations_hash ||= Federation.find.each_with_object({}) do |f, hash|
      next unless
        f.targetDomainCName == CurrentDomain.cname &&
        f.lensName.empty? &&
        f.acceptedUserId.present?

      hash[f.sourceDomainId] = f.sourceDomainCName
    end
  end

  def federated_facet
    all_feds = federations_hash.sort_by(&:last).map do |f_id, f_cname|
      {
        text: f_cname,
        value: f_id.to_s,
        icon: {
          type: 'static',
          href: "/api/domains/#{f_cname}/icons/smallIcon"
        }
      }
    end

    return nil if all_feds.length < 1

    all_feds.unshift(
      text: 'This site only',
      value: CurrentDomain.domain.id.to_s,
      icon: {
        type: 'static',
        href: "/api/domains/#{CurrentDomain.cname}/icons/smallIcon"
      }
    )

    fed_chop = get_facet_cutoff(:federation)
    top_feds = all_feds.slice(0, fed_chop)
    fed_cloud = all_feds[fed_chop..-1] if all_feds.length > fed_chop

    {
      title: t('controls.browse.facets.federated_domains_title'),
      singular_description: t('controls.browse.facets.federated_domains_singular_title'),
      param: :federation_filter,
      options: top_feds,
      extra_options: fed_cloud
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

    if browse_options[:curated_region_candidates]
      search_options[:options] ||= []
      search_options[:options] << 'curated_region_candidates'
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
      (cfs unless using_cetera?), # to be implemented
      categories_facet,
      (topics_facet unless using_cetera?), # to be implemented
      federated_facet
    ]

    browse_options[:facets] = browse_options[:facets].compact.flatten.reject { |f| f[:hidden] }

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

    # TODO: include? filters should be done on sets
    # get the subset relevant to various things
    browse_options[:search_options] =
      browse_options.select { |k| @@search_options.include?(k) }.merge(search_options)

    ignore_params = (browse_options[:ignore_params] || []) + [:controller, :action, :page]
    browse_options[:user_params] = user_params.reject { |k| ignore_params.include?(k) }

    # insert utf8 snowman thing
    browse_options[:user_params][:utf8] = '✓'

    # Don't get rows in search, just in JS
    browse_options[:row_count] = browse_options[:search_options].delete(:row_count)

    if browse_options[:view_results].blank?
      begin
        view_results =
          if using_cetera?
            # TODO: actually check if federation is enabled first
            fed_id = browse_options[:search_options][:federation_filter]
            browse_options[:search_options][:domains] =
              if fed_id.present?
                # Federation filter domain id has to be translated to domain cname for Cetera
                federations_hash.merge(CurrentDomain.domain.id => CurrentDomain.cname)[fed_id.to_i]
              else
                # All domains in the federation
                [CurrentDomain.cname].concat(federations_hash.values.sort).join(',')
              end
            Cetera.search_views(browse_options[:search_options])
          else
            Clytemnestra.search_views(browse_options[:search_options])
          end

        browse_options[:view_count] = view_results.count
        browse_options[:view_results] = view_results.results

      rescue CoreServer::TimeoutError
        Rails.logger.warn("Timeout on Clytemnestra request for #{browse_options.to_json}")
        browse_options[:view_request_error] = true
        browse_options[:view_results] = []

      rescue => e
        Rails.logger.error("Unexpected error for #{browse_options.to_json}: #{e}")
        browse_options[:view_request_error] = true
        browse_options[:view_results] = []
      end
    end

    # TODO: implement federated? for Cetera
    # check whether or not we need to display icons for other domains
    browse_options[:use_federations] =
      if browse_options[:nofederate]
        false
      elsif browse_options[:use_federations].nil?
        browse_options[:view_results].any?(&:federated?)
      end

    # set up which grid columns to display if we don't have one already
    browse_options[:grid_items] ||=
      case browse_options[:view_type]
      when 'rich'
        {
          largeImage: true,
          richSection: true,
          popularity: true,
          type: true,
          rss: true
        }
      else
        {
          index: true,
          domainIcon: browse_options[:use_federations],
          nameDesc: true,
          datasetActions: browse_options[:dataset_actions],
          popularity: true,
          type: true
        }
      end

    # In Cetera search, hide the RSS feed links as well as the popularity count
    if using_cetera?
      browse_options[:hide_catalog_rss] = true
      browse_options[:grid_items][:rss] = false
      browse_options[:grid_items][:popularity] = false
    end

    # Set browse partial paths based on using_cetera
    if using_cetera?
      browse_options[:browse_table_partial] = 'datasets/browse_table_cetera'
      browse_options[:browse_counter_partial] = 'datasets/browse_counter_cetera'
    else
      browse_options[:browse_table_partial] = 'datasets/browse_table_clytemnestra'
      browse_options[:browse_counter_partial] = 'datasets/browse_counter'
    end

    browse_options[:title] ||= get_title(browse_options, browse_options[:facets])

    browse_options[:show_catalog_sort_dropdown] =
      browse_options[:view_count] &&
      browse_options[:view_count] > 0 &&
      !browse_options[:view_request_error] &&
      !browse_options[:sort_opts].empty? &&
      !browse_options[:disable][:sort] &&
      !browse_options[:cetera_search]

    return browse_options
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

  def data_lens_transition_state
    # Ignore feature flags defined in the view metadata (first argument) but
    # allow feature flag overrides in the query string (second argument)
    FeatureFlags.derive(nil, defined?(request) ? request : nil)[:data_lens_transition_state]
  end

  def data_lens_phase_beta?
    data_lens_transition_state == 'beta'
  end

  def data_lens_phase_post_beta?
    data_lens_transition_state == 'post_beta'
  end

  def current_user_can_edit_others_datasets?
    (defined?(current_user) &&
      CurrentDomain.user_can?(current_user, :edit_others_datasets))
  end

  def add_data_lens_view_type?
    should_show_data_lenses = false

    if data_lens_phase_beta?
      should_show_data_lenses = current_user_can_edit_others_datasets?
    elsif data_lens_phase_post_beta?
      should_show_data_lenses = true
    end

    should_show_data_lenses
  end

  # TODO: All the add with pluck should be made immutable merges and sorted

  def add_data_lens_view_type_if_enabled!(view_type_list)
    if add_data_lens_view_type?

      new_view_option = {
        :text => ::I18n.t('controls.browse.facets.view_types.new_view'),
        :value => 'new_view',
        :class => 'typeNewView',
        :icon_font_class => 'icon-cards',
        :help_link => {
          :href => 'http://www.socrata.com/datalens',
          :text => ::I18n.t('controls.browse.facets.view_types.new_view_help')
        }
      }

      # Data lens pages are the new way to look at datasets, so insert above datasets
      datasets_index = view_type_list.pluck(:value).index('datasets') || 0
      view_type_list.insert(datasets_index, new_view_option)
    end
  end

  def pulse_catalog_entries_enabled?
    FeatureFlags.derive(nil, defined?(request) ? request : nil)[:enable_pulse]
  end

  def add_pulse_view_type_if_enabled!(view_type_list)
    if pulse_catalog_entries_enabled?

      pulse_view_type = {
        :text => ::I18n.t('controls.browse.facets.view_types.pulse'),
        :value => 'pulse',
        :class => 'typePulse',
        :icon_font_class => 'icon-pulse',
        :help_link => {
          :href => 'http://www.socrata.com',
          :text => ::I18n.t('controls.browse.facets.view_types.pulse_help')
        }
      }

      # Position the pulse page similarily to Stories and Data Lens - Above the dataset entry

      datasets_index = view_type_list.pluck(:value).index('datasets') || 0
      view_type_list.insert(datasets_index, pulse_view_type)
    end
  end

  def stories_catalog_entries_enabled?
    FeatureFlags.derive(nil, defined?(request) ? request : nil)[:enable_stories]
  end

  def add_stories_view_type_if_enabled!(view_type_list)
    if stories_catalog_entries_enabled?

      stories_view_type = {
        :text => ::I18n.t('controls.browse.facets.view_types.story'),
        :value => 'story',
        :class => 'typeStory',
        :icon_font_class => 'icon-story',
        :help_text => ::I18n.t('controls.browse.facets.view_types.story_help')
      }

      # Stories are more contextualized than datasets, so put them above dataset entry
      datasets_index = view_type_list.pluck(:value).index('datasets') || 0
      view_type_list.insert(datasets_index, stories_view_type)
    end
  end

  @@default_cutoffs = {
    :custom => 5,
    :category => 5,
    :federation => 5,
    :topic => 5
  }
  @@cutoff_store = {}

  @@numeric_options = [ :limit, :page ]
  @@boolean_options = [ :nofederate, :curated_region_candidates ]

  @@moderatable_types = [ 'filters', 'charts', 'maps', 'calendars', 'forms' ]

  @@search_options = [ :id, :name, :tags, :desc, :q, :category, :limit, :page, :sortBy, :limitTo, :for_user, :datasetView, :sortPeriod, :admin, :nofederate, :moderation, :xmin, :ymin, :xmax, :ymax, :for_approver, :approval_stage_id, :publication_stage, :federation_filter, :metadata_tag, :row_count, :q_fields, :local_data_hack ]
  @@querystring_options = [  ]
end
