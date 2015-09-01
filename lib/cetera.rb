require 'ostruct'
require 'forwardable'
require 'cgi'

module Cetera
  @@cetera_host = APP_CONFIG['cetera_host']
  @@version = 'v1'
  @@api_path = "catalog/#{@@version}"

  def self.search_views(opts)
    params = cetera_soql_params(opts)
    path = "#{@@cetera_host}/#{@@api_path}#{params}"
    result = Net::HTTP.get_response(URI(path))
    CeteraSearchResult.from_result(result.body)
  end

  def self.cetera_soql_params(opts = {})
    # Hack to populate catalog with chicago data for local testing
    # Add local_data_hack=true in the URL search params
    domain = opts[:local_data_hack] ? 'data.cityofchicago.org' : CurrentDomain.cname

    # Translate to Cetera syntax
    only = case opts[:limitTo]
    when 'tables'
      'datasets'
    when 'new_view'
      'pages'
    else
      opts[:limitTo]
    end

    params = ''

    query = opts[:q] ? CGI::escape(opts[:q]) : nil
    # Calculate the Cetera offset by 0-indexing page and multiplying
    # by the limit (number of results per page).
    offset = opts[:page] ? (opts[:page] - 1) * opts[:limit] : 0
    {
      :domains => domain,
      :search_context => domain,
      :only => only,
      :q => query,
      :offset => offset,
      :limit => opts[:limit],
      :highlight => true
    }.reject { |k, v| v.nil? }.each_with_index { |(key, value), index|
      params += "#{(index == 0) ? '?' : '&'}#{key}=#{value}"
    }
    params
  end

  class CeteraResultRow
    extend Forwardable

    def initialize(data)
      @data = data
      @resource = @data['resource']
      @classification = @data['classification']

      @data_ostruct = OpenStruct.new(
        :id => @resource['id'],
        :link => @data['link'],
        :name => @resource['name'],
        :description => @resource['description'],
        :type => @resource['type'],
        :categories => @classification['categories'],
        :tags => @classification['tags']
      )
    end

    def_delegators :@data_ostruct, :id, :link, :name, :description, :type, :categories, :tags

    def display_title
      case type
      when 'dataset'
        Cetera::Displays::Dataset.title
      when 'page'
        Cetera::Displays::Page.title
      else
        Airbrake.notify(
          :error_class => 'CeteraUnrecognizedTypeError',
          :error_message => "Frontend unable to match Cetera type #{type}"
        )
        ''
      end
    end

    def display_class
      case type
      when 'dataset'
        Cetera::Displays::Dataset.type.capitalize
      when 'page'
        Cetera::Displays::Page.type.capitalize
      else
        Airbrake.notify(
          :error_class => 'CeteraUnrecognizedTypeError',
          :error_message => "Frontend unable to match Cetera type #{type}"
        )
        ''
      end
    end

    def icon_class
      case type
      when 'dataset'
        Cetera::Displays::Dataset.icon_class
      when 'page'
        Cetera::Displays::Page.icon_class
      else
        Airbrake.notify(
          :error_class => 'CeteraUnrecognizedTypeError',
          :error_message => "Frontend unable to match Cetera type #{type}"
        )
        'icon'
      end
    end

    def default_page
      @resource['defaultPage']
    end

    def federated?
      false # TODO
    end

    def new_view?
      type == 'page'
    end

    def story?
      type == 'story'
    end

    def domainCName
      @resource['domain'] || ''
    end
  end

  class SearchResult
    attr_reader :data

    class << self; attr_accessor :klass; end

    def initialize(data = {})
      @data = data
    end

    def self.from_result(result)
      unless result.nil?
        obj = self.new(JSON.parse(result, :max_nesting => 25))
      end
    end

    def results
      @results ||= (data['results'] || []).map{ |data| self.class.klass.new(data) }
    end

    def count
      data['resultSetSize']
    end
  end

  class CeteraSearchResult < SearchResult
    @klass = Cetera::CeteraResultRow
  end
end
