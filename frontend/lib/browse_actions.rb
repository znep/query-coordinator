# encoding: utf-8

require 'set'

module BrowseActions
  include ActionView::Helpers::TranslationHelper
  include ApplicationHelper
  include CommonSocrataMethods # forwardable_session_cookies
  include Socrata::RequestIdHelper
  include Socrata::CookieHelper

  protected

  attr_reader :request_params

  def standard_view_types
    href_translation_key = feature_flag?(:usaid_features_enabled, request) ? 'data_assets' : 'href'

    [
      { text: t('controls.browse.facets.view_types.data_lens'), value: 'new_view', class: 'typeDataLens', icon_font_class: 'icon-cards' },
      { text: t('controls.browse.facets.view_types.datasets'), value: 'datasets', class: 'typeBlist' },
      { text: t('controls.browse.facets.view_types.charts'), value: 'charts', class: 'typeChart' },
      { text: t('controls.browse.facets.view_types.maps'), value: 'maps', class: 'typeMap' },
      { text: t('controls.browse.facets.view_types.calendars'), value: 'calendars', class: 'typeCalendar' },
      { text: t('controls.browse.facets.view_types.filters'), value: 'filters', class: 'typeFilter' },
      { text: t("controls.browse.facets.view_types.#{href_translation_key}"), value: 'href', class: 'typeHref' },
      { text: t('controls.browse.facets.view_types.blob'), value: 'blob', class: 'typeBlob' },
      { text: t('controls.browse.facets.view_types.forms'), value: 'forms', class: 'typeForm' }
    ]
  end

  def base_view_types_facet
    {
      type: :type,
      title: t('controls.browse.facets.view_types_title'),
      singular_description: t('controls.browse.facets.view_types_singular_title'),
      param: :limitTo,
      use_icon: true
    }
  end

  def view_types_facet
    view_types = standard_view_types

    add_stories_view_type_if_enabled!(view_types)
    add_pulse_view_type_if_enabled!(view_types)

    whitelisted_view_types = CurrentDomain.property(:view_types_facet, :catalog)
    if whitelisted_view_types # WARN: if you leave this an empty array, no view types!
      view_types.select! { |vt| whitelisted_view_types.include?(vt[:value]) }
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

    {
      :type => :category,
      :title => t('controls.browse.facets.categories_title'),
      :singular_description => t('controls.browse.facets.categories_singular_title'),
      :param => :category,
      :options => cats,
      :extra_options => hidden_cats # WARN: I could be nil
    }
  end

  def authority_facet(params = nil)
    {
      :type => :authority,
      :title => t('controls.browse.facets.authority.title'),
      :singular_description => t('controls.browse.facets.authority.singular_title'),
      :hidden => !FeatureFlags.derive.show_provenance_facet_in_catalog,
      :param => :provenance,
      :options => [
        { text: t('controls.browse.facets.authority.official'), value: 'official' },
        { text: t('controls.browse.facets.authority.community'), value: 'community' }
      ],
      :sort_facet_options => false
    }
  end

  def topics_facet(params = nil)
    params = params || request_params || {}

    topic_chop = get_facet_cutoff(:topic)

    if using_cetera?
      # TODO: Fix this line when we stop using globals in DataSlate server-rendering.
      dl_request = defined?(request) ? nil : Canvas::Environment.request || Canvas2::Util.request
      req_id = (defined?(dl_request) && request_id(dl_request)) || current_request_id
      cookies =
        (defined?(dl_request) && defined?(dl_request.cookies) &&
          forwardable_session_cookies(dl_request.cookies)) || current_cookies

      all_tags = Cetera::Utils.get_tags(req_id, cookies).results
      title = t('controls.browse.facets.tags_title')
      singular_description = t('controls.browse.facets.tags_singular_title')
    else
      all_tags = Tag.find(:method => 'viewsTags')
      title = t('controls.browse.facets.topics_title')
      singular_description = t('controls.browse.facets.topics_singular_title')
    end

    # top_tags appear above the fold and contain the first "topic_chop" number of tags + the selected tag
    top_tags = all_tags.slice(0, topic_chop).map do |tag|
      {:text => tag.name, :value => tag.name, :count => tag.frequency}
    end
    if params[:tags].present? && top_tags.none? { |tag| tag[:text] == params[:tags] }
      prepend_requested_tag = lambda do |tag|
        top_tags.push(
          :text => tag,
          :value => tag,
          :count => all_tags.select{ |tag| tag.name == tag }.first.try(:frequency) || 0
        )
      end

      Array(params[:tags]).each(&prepend_requested_tag)
    end
    top_tags.sort_by! { |tag| tag[:text] }

    tag_cloud = nil
    if all_tags.length > topic_chop
      tag_cloud = all_tags.sort_by(&:name).
        map { |tag| { :text => tag.name, :value => tag.name, :count => tag.frequency } }
    end

    {
      :type => :topic,
      :title => title,
      :singular_description => singular_description,
      :param => :tags,
      :options => top_tags,
      :extra_options => tag_cloud,
      :tag_cloud => true
    }
  end

  def federated_facet
    all_feds = Federation.federations.sort_by(&:text).map do |fed|
      cname = fed.sourceDomainCName
      {
        text: federated_site_title(cname),
        value: fed.sourceDomainId.to_s, # must be string or view doesn't notice it
        icon: {
          type: 'static',
          href: "/api/domains/#{cname}/icons/smallIcon"
        }
      }
    end

    return nil if all_feds.length < 1

    all_feds.unshift(
      text: t('controls.browse.facets.this_site_only'),
      value: CurrentDomain.domain.id.to_s, # must be string or view won't notice
      icon: {
        type: 'static',
        href: "/api/domains/#{CurrentDomain.cname}/icons/smallIcon"
      }
    )

    fed_chop = get_facet_cutoff(:federation)
    top_feds = all_feds.slice(0, fed_chop)
    fed_cloud = all_feds[fed_chop..-1] if all_feds.length > fed_chop

    {
      type: :domain,
      title: t('controls.browse.facets.federated_domains_title'),
      singular_description: t('controls.browse.facets.federated_domains_singular_title'),
      param: :federation_filter,
      options: top_feds,
      extra_options: fed_cloud
    }
  end

  def moderation_facet
    {
      :type => :moderation,
      :title => t('controls.browse.facets.moderation_status_title'),
      :singular_description => t('controls.browse.facets.moderation_status_singular_title'),
      :param => :moderation,
      :options => [
        {:text => t('controls.browse.facets.moderation_status.pending'), :value => 'pending'},
        {:text => t('controls.browse.facets.moderation_status.accepted'), :value => 'accepted'},
        {:text => t('controls.browse.facets.moderation_status.rejected'), :value => 'rejected'}
      ]
    }
  end

  # Unlike other facets with normal hashes, I use Hashie::Mash
  def custom_facets(params = nil)
    params = params || request_params || {}
    facets = CurrentDomain.property(:custom_facets, :catalog) # Array of Hashie::Mash

    return if facets.nil?

    # NOTE: Dupping because high mutability going on here!
    facets = facets.map(&:dup)

    custom_chop = get_facet_cutoff(:custom)
    facets.map do |facet|
      facet.param = facet.param.to_sym

      if facet.options && facet.options.length > custom_chop

        # NOTE: Anything marked as 'summary' is guaranteed visible; if there
        # are no 'summary' facets, then remaining facets are eligible for
        # visibility up to the cutoff threshold. "summary":true in
        # custom_facets will override "custom":number in facet_cutoffs
        facet.options, facet.extra_options = facet.options.partition { |opt| opt.summary }

        if facet.options.empty?
          facet.options = facet.extra_options.slice!(0..(custom_chop - 1))

          # If an option below the "fold" is active (filtered on), move it from
          # extra_options to options to force it to appear above the fold.
          active_option = params[facet.param]
          found_option = (facet.extra_options || []).find { |option| option[:value] == active_option }

          if found_option
            facet.options.push(found_option)
            facet.extra_options.delete(found_option)
          end
        end
      end

      facet.with_indifferent_access
    end
  end

  # TODO: Remove the class variable "caching"
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
      user_params = request.params.except('custom_path').to_hash.deep_symbolize_keys
    end

    # grab configured params
    configured_params = (catalog_config.default_params || {}).to_hash.deep_symbolize_keys

    # deal with default base_url wrt localization (ergghhhh bad hack.)
    base_url = "#{locale_url_prefix}#{request.path}"

    # next deal with options
    default_options = {
      limit: 10,
      page: 1,
      port: request.port,
      disable: {},
      no_results_text: t('controls.browse.listing.no_results'),
      timeout_text: t('controls.browse.listing.error'),
      base_url: base_url,
      view_type: 'table'
    }

    configured_options = catalog_config.to_hash.deep_symbolize_keys
    configured_options.delete(:default_params)

    browse_options = default_options.
      merge(configured_options). # whatever they configured is somewhat important
      merge(options).            # whatever the call configures is more important
      merge(configured_params).  # gives the domain a chance to override the call
      merge(user_params)         # anything from the queryparam is most important

    # munge params to types we expect
    @@numeric_options.each do |option|
      browse_options[option] = browse_options[option].to_i if browse_options[option].present?
      user_params[option] = user_params[option].to_i if user_params[option].present?
    end
    @@boolean_options.each do |option|
      if browse_options[option].present?
        browse_options[option] = (browse_options[option] == 'true') || (browse_options[option] == true)
      end
      if user_params[option].present?
        user_params[option] = (user_params[option] == 'true') || (user_params[option] == true)
      end
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
        f_value = browse_options[facet[:param]]
        next unless f_value.present?

        f_param = facet[:param].to_s
        if using_cetera?
          browse_options[:metadata_tag] ||= {}
          browse_options[:metadata_tag].merge!(f_param => f_value)
        else
          browse_options[:metadata_tag] ||= []
          browse_options[:metadata_tag] << "#{f_param}:#{f_value}"
        end
      end
    end

    search_options[:options] ||= []

    if browse_options[:curated_parent_region_candidates]
      search_options[:options] << 'curated_parent_region_candidates'
    end

    if %w(true t).include?(browse_options[:show_hidden].to_s.downcase)
      search_options[:options] << 'show_hidden'
    end

    if browse_options[:limitTo].present?
      case browse_options[:limitTo]
        when 'new_view'
          if visualization_canvas_enabled? && using_cetera?
            search_options[:limitTo] = ['new_view', 'visualization']
          end
        when 'unpublished'
          if draft_dataset_entries_enabled?
            search_options[:limitTo] = ['draft', 'tables']
          else
            search_options[:limitTo] = 'tables'
          end
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

    unless browse_options[:sortBy].present?
      browse_options[:sortBy] = 'relevance'
    end

    # TEMPORARY TERRIBLENESS: to get a visualizations-only facet showing up in
    # storyteller's asset selector for rich media blocks, we have to add it here
    # instead of doing it the same way we add other conditional facets, because
    # we have to key off the presence of limitTo[]=visualizations.
    actual_view_types_facet = view_types_facet
    if browse_options[:limitTo].try(:include?, 'visualization') && visualization_canvas_enabled?
      actual_view_types_facet[:options] << visualization_view_type
    end

    browse_options[:facets] ||= [
      authority_facet,
      categories_facet,
      actual_view_types_facet,
      cfs,
      topics_facet,
      federated_facet
    ]

    browse_options[:facets] = browse_options[:facets].compact.flatten.reject { |f| f[:hidden] }

    if browse_options[:suppressed_facets].is_a? Array
      browse_options[:facets].reject! do |facet|
        browse_options[:suppressed_facets].include? facet[:singular_description]
      end
    end

    if browse_options[:filtered_types].is_a? Array
      type_facet = browse_options[:facets].find { |facet| facet[:type] == :type }
      type_facet.try(:[], :options).try(:select!) do |facet|
        browse_options[:filtered_types].include? facet[:value]
      end
    end

    browse_options[:sidebar_config] = catalog_config.sidebar
    browse_options[:header_config]  = catalog_config.header
    browse_options[:footer_config]  = catalog_config.footer

    browse_options[:sort_opts] ||= browse_sort_opts
    browse_options[:disable] = {} unless browse_options[:disable].present?

    # get the subset relevant to various things
    browse_options[:search_options] =
      browse_options.select { |k| @@search_options.include?(k) }.merge(search_options)

    ignore_params = (browse_options[:ignore_params] || []) + [:controller, :action, :page]
    browse_options[:user_params] = user_params.reject { |k| ignore_params.include?(k) }

    # Don't get rows in search, just in JS
    browse_options[:row_count] = browse_options[:search_options].delete(:row_count)

    if browse_options[:view_results].blank?
      begin
        view_results =
          if using_cetera?
            # TODO: actually check if federation is enabled first

            # WARN: federated domains are not showing up highlighted in facet bar

            # Domain ids have to be translated to domain cnames for Cetera
            # TODO: we could easily construct a domain ids filter in Cetera if desired
            fed_id = browse_options[:search_options][:federation_filter]
            browse_options[:search_options][:domains] = Federation.federated_domain_cnames(fed_id)

            # If you try to federate from a domain that didn't approve it, no federation for you!
            unless browse_options[:search_options][:domains].present?
              raise "Invalid federated domain id: #{fed_id} for domain #{CurrentDomain.cname}"
            end

            browse_options[:search_options][:domain_boosts] = Federation.federated_search_boosts
            browse_options[:search_options][:categories] = selected_category_and_any_children(browse_options)

            if boost_official_views?
              official_boost = CurrentDomain.property(:official_boost, :catalog).to_f
              if official_boost > 0
                boost = official_boost
              else
                boost = 2.0
              end
              browse_options[:search_options][:boostOfficial] = boost
            end

            browse_options[:search_options][:default_sort] = CurrentDomain.property(:sortBy, :catalog)

            # localize catalog links if locale is present
            browse_options[:search_options][:locale] = locale unless locale.nil?

            # @profile_search_method is set in the profile controller
            if @profile_search_method
              Clytemnestra.search_views(browse_options[:search_options])
            else
              # So, this is necessary because CookieHelper and RequestIdHelper are
              # thread-dependent and Dataslate's rendering strategy uses a multi-threaded
              # approach, hiding them from the main thread's state.
              dataslate_hackery = lambda do |method_name|
                send(:"current_#{method_name}") ||
                  Canvas::Environment.send(method_name) ||
                  Canvas2::Util.send(method_name)
              end

              Cetera::Utils.public_send(
                :search_views,
                dataslate_hackery.call(:request_id),
                dataslate_hackery.call(:cookies),
                browse_options[:search_options]
              )
            end
          else
            Clytemnestra.search_views(browse_options[:search_options])
          end

        browse_options[:view_count] = view_results.count
        browse_options[:view_results] = view_results.results

      # EN-5680: browse_options is huge for customers who use a lot of facets, and spitting
      # out all of it into our logs is verbose (and costly for Sumo). Instead let's make
      # abridged_browse_options which doesn't have all the facets and results.
      abridged_browse_options = browse_options.dup.tap do |options|
        options.delete(:facets)
        options.delete(:custom_facets)
        options.delete(:view_results)
      end.to_json

      rescue CoreServer::TimeoutError
        Rails.logger.warn("Timeout on CoreServer request for #{abridged_browse_options}")
        browse_options[:view_request_error] = true
        browse_options[:view_results] = []

      rescue Timeout::Error # Cetera calls just uses HTTParty
        Rails.logger.warn("Timeout on Cetera request for #{abridged_browse_options}")
        browse_options[:view_request_error] = true
        browse_options[:view_request_timed_out] = true
        browse_options[:view_results] = []

      rescue => e
        Rails.logger.error("Unexpected error for #{abridged_browse_options}: #{e}")
        browse_options[:view_request_error] = true
        browse_options[:view_request_timed_out] = true # Untrue, but causes helpful browse2 error message
        browse_options[:view_results] = []
      end
    end

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

    # In Cetera search, hide popularity and rss links
    if using_cetera?
      browse_options[:grid_items][:popularity] = false
      browse_options[:grid_items][:rss] = false
      browse_options[:hide_catalog_rss] = true
    end

    # Set browse partial paths. Applies if the user not on the profile page.
    # @profile_search_method is set in profile controller
    if using_cetera? && @profile_search_method.nil?
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
      !browse_options[:disable][:sort]

    browse_options
  end

  def validate_parameters(browse_options)
    assertions = [
      browse_options[:limit].to_i > 0
    ]
    assertions.all?
  end

  def draft_dataset_entries_enabled?
    FeatureFlags.derive(nil, defined?(request) ? request : nil)[:ingress_reenter]
  end

  private

  # See also similar implementation in:
  # platform-ui/frontend/app/controllers/catalog_landing_page_controller.rb#compute_page_title
  def get_title(options, facets)
    title_fragments = []

    if options[:q].present?
      title_fragments << t('controls.browse.title.result.term', :term => options[:q])
    end

    facet_parts = []
    facets.each do |facet|
      if options[facet[:param]].present?
        if facet[:singular_description].present?
          facet_item = nil
          facet_options = facet[:options] + facet[:extra_options].to_a
          facet_options.each do |facet_option|
            if facet_option[:value] == options[facet[:param]]
              facet_item = facet_option
            elsif facet_option[:children].present?
              facet_item ||= facet_option[:children].detect { |child| child[:value] == options[facet[:param]] }
            end
          end
          if facet_item.present?
            facet_parts << t(
              'controls.browse.title.result.facet',
              :facet_type => facet[:type],
              :facet_value => facet_item[:text]
            )
          end
        elsif facet[:custom_description].present?
          facet_parts << facet[:custom_description].call(options)
        end
      end
    end

    if facet_parts.present?
      title_fragments << t('controls.browse.title.result.facet_main', :body => facet_parts.compact.to_sentence)
    end

    title = if title_fragments.empty?
      options[:default_title] || t('controls.browse.title.default')
    else
      t('controls.browse.title.result.main', :body => title_fragments.join(', '))
    end

    # EN-17885: NASA 508 Compliance - Make page titles more different
    if options.to_h.with_indifferent_access.values_at(:page, :view_count, :limit).all?(&:present?)
      title << ' | ' << t('controls.browse.browse2.results.page_title',
        :page_number => options[:page],
        :page_count => (options[:view_count].to_f / options[:limit].to_f).ceil
      )
    end

    title.to_str  # force this string to be marked html unsafe
  end

  # Yes, there is conflation between browse2 and cetera.
  # browse2 and cetera are *always* coupled except in one temporary case:
  # in-flight customers use browse2 w/ Core/Cly until Cetera supports
  # staging lockdown sites via core auth (PR pending).
  def browse_sort_opts
    using_cetera? ? cetera_sort_opts : default_browse_sort_opts
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

  # browse.browse2 translates these to different display values,
  # but let's keep the underlying keys consistent.
  def cetera_sort_opts
    [
      { value: 'alpha', name: t('controls.browse.sorts.alpha') },
      { value: 'most_accessed', name: t('controls.browse.browse2.sorts.most_accessed') },
      { value: 'relevance', name: t('controls.browse.browse2.sorts.relevance') },
      { value: 'newest', name: t('controls.browse.browse2.sorts.newest') },
      { value: 'last_modified', name: t('controls.browse.browse2.sorts.last_modified') }
    ]
  end

  # Unused for now, but this will refresh the cutoffs from the configs service
  def self.clear_cutoff_cache(cname = nil)
    @@cutoff_store.delete(cname || CurrentDomain.cname)
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

      # Position the pulse page similarily to Stories - Above the Datalens entry

      datasets_index = view_type_list.pluck(:value).index('datasets') || 0
      view_type_list.insert(datasets_index, pulse_view_type)
    end
  end

  def stories_catalog_entries_enabled?
    FeatureFlags.derive(nil, defined?(request) ? request : nil)[:stories_show_facet_in_catalog]
  end

  def add_stories_view_type_if_enabled!(view_type_list)
    if stories_catalog_entries_enabled?
      stories_view_type = {
        :text => ::I18n.t('controls.browse.facets.view_types.story'),
        :value => 'story',
        :class => 'typeStory',
        :icon_font_class => 'icon-story'
      }

      # Stories are more contextualized than datasets, so put them above dataset entry
      datasets_index = view_type_list.pluck(:value).index('datasets') || 0
      view_type_list.insert(datasets_index, stories_view_type)
    end
  end

  def visualization_view_type
    {
      :text => ::I18n.t('controls.browse.facets.view_types.visualization'),
      :value => 'visualization', # sets the limitTo param for this facet
      :class => 'typeDataLens', # sets a CSS class which affects icon color
      :icon_font_class => 'icon-cards', # sets the facet icon
      :help_link => {
        :href => 'https://socrata.zendesk.com/knowledge/articles/115000813847',
        :text => ::I18n.t('controls.browse.facets.view_types.visualization_help')
      }
    }
  end

  # This is only needed by Cetera; Core can add children on the server side
  # we're operating as though there's only one category, even though cetera
  # will expect an array of the parent and children categories[].
  def selected_category_and_any_children(browse_options)
    search_options = browse_options[:search_options]
    selected_category = search_options.try(:[], :category)

    return nil unless selected_category.present?

    categories_facet = browse_options[:facets].detect { |facet| facet[:param] == :category }

    # extra_options could potentially be nil (see EN-760 and categories_facet method)
    # categories_facet, technically speaking, could be absent
    categories = categories_facet && categories_facet[:options] + categories_facet[:extra_options].to_a
    categories ||= [] # this is for the edge case when there is no categories facet

    # Is it a top-level category?
    category = categories.find { |c| c[:value] == selected_category }

    # If not, let's check the children
    category ||= begin
      children = categories.collect { |c| c[:children] }.flatten.compact
      children.find { |c| c[:value] == selected_category }
    end

    # If still not found, it's a bogus category but we'll pass it along anyway
    category ||= { value: selected_category }

    [
      category[:value],
      category[:children] && category[:children].map { |child| child[:value] }
    ].compact.flatten
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

  @@moderatable_types = Set.new([ 'new_view', 'filters', 'charts', 'maps', 'calendars', 'forms' ])

  # See also cetera_soql_params in lib/cetera.rb
  @@search_options = Set.new(
    [
      :id, :name, :tags, :desc, :q, :category, :limit, :page, :sortBy, :limitTo,
      :for_user, :datasetView, :sortPeriod, :admin, :nofederate, :moderation,
      :xmin, :ymin, :xmax, :ymax, :for_approver, :approval_stage_id,
      :publication_stage, :federation_filter, :metadata_tag, :row_count, :q_fields,
      :shared_to, :provenance
    ]
  )
end
