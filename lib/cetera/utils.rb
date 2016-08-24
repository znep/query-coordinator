require 'httparty'

# Interface for Cetera, the new search service https://github.com/socrata/cetera
#
# Note: the cetera-ruby gem also shares the Cetera namespace. If you don't find
# what you're looking for in here, it's probably coming from the gem.
module Cetera
  class Utils
    def self.base_uri
      APP_CONFIG.cetera_host # cetera_host is misnamed; it is actually a uri.
    end

    def self.get(path, options)
      uri = File.join(base_uri, path)
      Rails.logger.info("Cetera request to #{path} with query: #{options[:query].inspect}")

      response = HTTParty.get(uri, options)
      Rails.logger.error("FAILED Cetera request: #{response.body}") unless response.success?

      response
    end

    def self.get_tags(cookie_string, request_id)
      path = '/catalog/v1/domain_tags'
      opts = { domains: [CurrentDomain.cname] }
      query = cetera_soql_params(opts)
      options = request_options(query, cookie_string, request_id)

      response = get(path, options)
      response.success? ?
        ::Cetera::Results::TagCountResult.new(response) :
        ::Cetera::Results::TagCountResult.new('results' => [])
    end

    # Admins only! For now, do not call this without a search query.
    def self.search_users(search_query, cookie_string, request_id = nil)
      path = '/whitepages/v1'
      options = request_options({ q: search_query }.compact, cookie_string, request_id)

      response = get(path, options)

      # app/controllers/administration_controller.rb does not handle user search failures
      response.success? ?
        ::Cetera::Results::UserSearchResult.new(response) :
        ::Cetera::Results::UserSearchResult.new('results' => [])
    end

    def self.search_owned_by_user(search_query, cookie_string, request_id = nil)
      cleaned_query = cetera_soql_params(search_query)
      # Cetera requires only shared_to param be passed, not for_user
      query = cleaned_query.except(:shared_to)

      response = get(personal_catalog_path, request_options(query, cookie_string, request_id))
      response.success? ?
        ::Cetera::Results::CatalogSearchResult.new(response) :
        ::Cetera::Results::CatalogSearchResult.new('results' => [])
    end

    def self.search_shared_to_user(search_query, cookie_string, request_id = nil)
      cleaned_query = cetera_soql_params(search_query)
      # Cetera requires only shared_to param be passed, not for_user
      cleaned_query[:shared_to] = cleaned_query[:for_user]
      query = cleaned_query.except(:for_user)

      response = get(personal_catalog_path, request_options(query, cookie_string, request_id))
      response.success? ?
        ::Cetera::Results::CatalogSearchResult.new(response) :
        ::Cetera::Results::CatalogSearchResult.new('results' => [])
    end

    # 90%+ of search queries go through here so try not to break anything
    # TODO: Do we want this to match the signature of search_users?
    def self.search_views(opts = {}, cookie_string = nil, request_id = nil)
      path = '/catalog/v1'
      query = cetera_soql_params(opts)
      options = request_options(query, cookie_string, request_id)

      response = get(path, options)
      response.success? && ::Cetera::Results::CatalogSearchResult.new(response)
    end

    def self.get_derived_from_views(uid, options = {})
      cookie_string = options.delete(:cookie_string)
      request_id = options.delete(:request_id)
      locale_string = options.delete(:locale)
      search_options = options.merge({
        search_context: CurrentDomain.cname,
        domains: [CurrentDomain.cname],
        derived_from: uid,
        locale: locale_string
      }).compact

      response = search_views(search_options, cookie_string, request_id)

      response ? response.results : []
    end

    #########
    # Helpers

    def self.request_options(query, cookie_string, request_id)
      {
        format: :json,
        headers: {
          'Content-Type' => 'application/json',
          'Cookie' => cookie_string,
          'X-Socrata-Host' => CurrentDomain.cname,
          'X-Socrata-RequestId' => request_id.present? ? request_id : nil
        }.compact,
        query: query.to_query,
        timeout: 5 # seconds, >10x Cetera's median round trip time
      }.compact
    end

    def self.personal_catalog_path
      'personal_catalog/v1'
    end

    #############
    # Translators
    #
    # Prepare Cetera params from browse_options[:search_options] in lib/browse_actions.rb

    def self.cetera_soql_params(opts = {})
      translations = translated_query_params(opts) # Some params must be translated / modified
      metadata = opts[:metadata_tag] || {} # Cetera treats unrecognized keys as custom metadata keys
      combined = [opts, translations, metadata].inject(:merge)

      validated_query_params(combined, metadata.keys) # filter out invalid keys and blank values
    end

    def self.translated_query_params(opts = {})
      {
        boostDomains: opts[:domain_boosts],
        domains: translate_domains(opts[:domains]),
        offset: translate_offset(opts[:offset], opts[:page], opts[:limit]),
        only: translate_display_type(opts[:limitTo], opts[:datasetView]),
        order: translate_sort_by(opts[:sortBy])
      }.compact
    end

    def self.translate_domains(domains)
      domains.present? && domains.join(',') # Cetera does not yet support domains[]
    end

    # Translate FE 'display_type' to Cetera 'type' (as used in limitTo/only)
    # NOTE: the camelCase mirrors the FE params
    def self.translate_display_type(limitTo, datasetView)
      if limitTo == 'tables' && datasetView == 'view'
        'filters'
      else
        {
          'data_lens' => 'datalenses',
          'new_view' => 'datalenses',
          'story' => 'stories',
          'pulse' => 'pulses',
          'tables' => 'datasets',
          'draft' => 'drafts',
          'blob' => 'files',
          'href' => 'links'
        }.fetch(limitTo, limitTo)
      end
    end

    # Translate either the offset from either the provided offset of using the provided page
    def self.translate_offset(offset, page, limit)
      if offset
        offset
      elsif page && limit
        (page - 1) * limit
      else
        0
      end
    end

    # Translate FE 'sortBy' values to Cetera 'order'
    def self.translate_sort_by(sort_by)
      {
        nil => 'relevance', # Critical that nil is a key
        'relevance' => 'relevance',
        'most_accessed' => 'page_views_total',
        'alpha' => 'name',
        'newest' => 'createdAt',
        'oldest' => 'createdAt ASC',
        'last_modified' => 'updatedAt',
        'date' => 'createdAt',
        'name' => 'name'
      }.fetch(sort_by) # For Core/Cly parity, we want no results if sort_by is bogus
    end

    ############
    # Validation

    # Really just validates the keys but that's better than nothing
    def self.validated_query_params(opts = {}, extra_keys = {})
      opts.select do |key, value|
        (valid_cetera_keys.include?(key) || extra_keys.include?(key)) && value.present?
      end
    end

    # Anything not explicitly supported here will be dropped
    def self.valid_cetera_keys
      Set.new(%i(boostCalendars boostCharts boostDatalenses boostDatasets boostDomains boostFiles
                 boostFilters boostForms boostHrefs boostMaps boostPulses boostStories categories
                 derived_from domains for_user limit locale offset only order q search_context tags
                 shared_to))
    end
  end
end
