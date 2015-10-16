require 'forwardable'
require 'httparty'
require 'ostruct'

module Cetera
  def self.search_views(opts)
    cetera_url = "#{APP_CONFIG.cetera_host}/catalog/v1"
    result = HTTParty.get(cetera_url, query: cetera_soql_params(opts))
    CeteraSearchResult.from_result(result.body)
  end

  # Translate FE 'limitTo' param to Cetera 'only' param
  def self.translate_limit_type(limitTo)
    {
      'tables' => 'datasets', # blame browse_actions.rb
      'blob' => 'files',
      'href' => 'external' # this will become 'links'
    }.fetch(limitTo, limitTo)
  end

  def self.cetera_soql_params(opts = {})
    {
      domains: opts[:domains],
      search_context: CurrentDomain.cname,
      only: translate_limit_type(opts[:limitTo]),
      categories: opts[:category],
      q: opts[:q],
      offset: opts[:page] ? (opts[:page] - 1) * opts[:limit] : 0,
      limit: opts[:limit],
      highlight: true
    }.reject { |_, v| v.blank? }
  end

  # A row of Cetera results
  class CeteraResultRow
    extend Forwardable

    def initialize(data)
      @data = data
      @resource = @data['resource']
      @classification = @data['classification']
      @metadata = @data['metadata']
      @id = @resource['id']

      # NOTE: dataset.js reasons about federation like so: if a row has a domainCName, that row is federated
      # Yes, we have the same thing in two places and one can be defined while the other is not.
      @domainCName = @metadata['domain'] if @metadata['domain'] != CurrentDomain.cname

      @data_ostruct = OpenStruct.new(
        id: @resource['id'],
        link: @data['link'],
        name: @resource['name'],
        description: @resource['description'],
        type: @resource['type'],
        categories: [@classification['domain_category']],
        tags: @classification['tags'],
        viewCount: @resource['view_count'] && @resource['view_count']['page_views_total'].to_i,
        domainCName: @metadata['domain'],
        updatedAt: @resource['updatedAt']
      )
    end

    def_delegators :@data_ostruct, :id, :link, :name, :description, :type, :categories, :tags, :viewCount, :domainCName, :updatedAt

    def airbrake_type_error(type)
      Airbrake.notify(
        error_class: 'CeteraUnrecognizedTypeError',
        error_message: "Frontend unable to match Cetera type #{type}"
      )
    end

    def display
      case type
      when 'dataset'
        Cetera::Displays::Dataset
      when 'file'
        Cetera::Displays::File

      # Cetera is replacing type 'href' with type 'link'
      when 'href'
        Cetera::Displays::Link
      when 'link'
        Cetera::Displays::Link

      when 'map'
        Cetera::Displays::Map
      else
        airbrake_type_error(type)
        # In development, you might want this to raise.
        # In production, probably not.
        Cetera::Displays::Base
      end
    end

    def display_title
      display.title
    end

    def display_class
      display.type.capitalize
    end

    def icon_class
      display.icon_class
    end

    def default_page
      @resource['defaultPage']
    end

    def federated?
      domainCName != CurrentDomain.cname
    end

    def new_view?
      type == 'page'
    end

    def story?
      type == 'story'
    end

    def domain_icon_href
      "/api/domains/#{domainCName}/icons/smallIcon"
    end
  end

  class SearchResult
    attr_reader :data

    class << self; attr_accessor :klass; end

    def initialize(data = {})
      @data = data
    end

    def self.from_result(result)
      new(JSON.parse(result, max_nesting: 25)) if result.present?
    end

    def results
      @results ||= (data['results'] || []).map { |data| self.class.klass.new(data) }
    end

    def count
      data['resultSetSize']
    end

    def display
    end
  end

  # Who uses this @klass?
  class CeteraSearchResult < SearchResult
    @klass = Cetera::CeteraResultRow
  end
end
