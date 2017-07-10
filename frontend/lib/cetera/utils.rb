require 'httparty'

# Interface for Cetera, the new search service https://github.com/socrata/cetera
#
# Note: the cetera-ruby gem also shares the Cetera namespace. If you don't find
# what you're looking for in here, it's probably coming from the gem.
module Cetera
  class Utils
    class << self

      def base_uri
        APP_CONFIG.cetera_internal_uri
      end

      def client
        return @cetera_client if @cetera_client

        cetera_uri = URI.parse(APP_CONFIG.cetera_internal_uri)
        @cetera_client = Cetera::Client.new(cetera_uri.host, cetera_uri.port)
      end

      def user_search_client
        Cetera::UserSearch.new(client, CurrentDomain.cname)
      end

      def autocomplete_search_client
        Cetera::AutocompleteSearch.new(client, CurrentDomain.cname)
      end

      def catalog_search_client
        Cetera::CatalogSearch.new(client, CurrentDomain.cname)
      end

      def facet_search_client
        Cetera::FacetSearch.new(client, CurrentDomain.cname)
      end

      def log_request(purpose, options)
        Rails.logger.info("Cetera request to #{purpose} with options: #{options.inspect}")
      end

      def get_tags(req_id, cookies = nil)
        opts = { domains: [CurrentDomain.cname] }
        params = cetera_soql_params(opts)
        log_request('get tags', params)
        begin
          response = facet_search_client.get_tags_of_anonymously_viewable_views(req_id, cookies, params)
          ::Cetera::Results::TagCountResult.new(response)
        rescue Exception => e
          ::Cetera::Results::TagCountResult.new({'results' => []})
        end
      end

      # 90%+ of search queries go through here so try not to break anything
      def search_views(req_id, cookies = nil, opts = {})
        params = cetera_soql_params(opts)
        log_request('get anonymously viewable views', params)
        response = catalog_search_client.find_anonymously_viewable_views(req_id, cookies, params)
        ::Cetera::Results::CatalogSearchResult.new(response)
      end

      def get_derived_from_views(uid, req_id, cookies = nil, opts = {})
        locale_string = opts.delete(:locale)
        params = opts.merge({
          domains: [CurrentDomain.cname],
          derived_from: uid,
          locale: locale_string
        }).compact

        response = search_views(req_id, cookies, params)

        response ? response.results : []
      end

      def get_asset_counts(asset_types, req_id, cookies = nil, options = {})
        {}.tap do |counts|
          asset_types.map do |asset_type|
            Thread.new do
              cetera_opts = options.merge(
                :only => asset_type,
                :domains => CurrentDomain.cname,
                :limit => 0
              )

              counts[asset_type] = catalog_search_client.
                find_views(req_id, cookies, cetera_opts).
                fetch('resultSetSize')
            end
          end.each(&:join)
        end
      end

      #############
      # Translators
      #
      # Prepare Cetera params from browse_options[:search_options] in lib/browse_actions.rb

      def cetera_soql_params(opts = {})
        translations = translated_query_params(opts) # Some params must be translated / modified
        metadata = opts[:metadata_tag] || {} # Cetera treats unrecognized keys as custom metadata keys
        combined = [opts, translations, metadata].inject(:merge)

        validated_query_params(combined, metadata.keys) # filter out invalid keys and blank values
      end

      def translated_query_params(opts = {})
        {
          boostDomains: opts[:domain_boosts],
          domains: translate_domains(opts[:domains]),
          offset: translate_offset(opts[:offset], opts[:page], opts[:limit]),
          only: translate_display_type(opts[:limitTo], opts[:datasetView]),
          order: translate_sort_by(opts[:sortBy] || opts[:default_sort])
        }.compact
      end

      def translate_domains(domains)
        domains.present? && domains.join(',') # Cetera does not yet support domains[]
      end
      # Translate FE 'display_type' to Cetera 'type' (as used in limitTo/only)
      # NOTE: the camelCase mirrors the FE params
      def translate_display_type(limitTo, datasetView)
        if limitTo.respond_to?(:to_ary)
          limitTo.to_ary.map { |t| translate_display_type(t, datasetView) }
        elsif limitTo == 'tables' && datasetView == 'view'
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
      def translate_offset(offset, page, limit)
        if offset
          offset
        elsif page && limit
          (page - 1) * limit
        else
          0
        end
      end

      # Translate FE 'sortBy' values to Cetera 'order'
      def translate_sort_by(sort_by)
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
      def validated_query_params(opts = {}, extra_keys = {})
        opts.select do |key, value|
          (valid_cetera_keys.include?(key) || extra_keys.include?(key)) && value.present?
        end
      end

      # Anything not explicitly supported here will be dropped
      def valid_cetera_keys
        Set.new(%i(boostCalendars boostCharts boostDatalenses boostDatasets boostDomains boostFiles
                   boostFilters boostForms boostHrefs boostMaps boostOfficial boostPulses
                   boostStories categories derived_from domains for_user limit locale offset only
                   order q search_context tags shared_to provenance public published
                   approval_status explicitly_hidden))
      end
    end
  end
end
