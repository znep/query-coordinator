require 'forwardable'
require 'ostruct'

module Cetera
  module Results
    # A row of Cetera results
    class ResultRow
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
          tags: @classification['domain_tags'],
          viewCount: @resource['page_views'] && @resource['page_views']['page_views_total'].to_i,
          domainCName: @metadata['domain'],
          updatedAt: @resource['updatedAt'],
          createdAt: @resource['createdAt'],
          previewImageUrl: @data['preview_image_url'],
          provenance: @resource['provenance'],
          permalink: @data['permalink']
        )
      end

      def_delegators :@data_ostruct,
                     :id, :link, :name, :description, :type, :categories, :tags, :viewCount,
                     :domainCName, :updatedAt, :createdAt, :previewImageUrl, :provenance, :permalink

      def airbrake_type_error(type)
        Airbrake.notify(
          error_class: 'CeteraUnrecognizedTypeError',
          error_message: "Frontend unable to match Cetera type #{type}"
        )
      end

      def display_map
        {
          'datalens' => ::Cetera::Displays::DataLens,
          'visualization' => ::Cetera::Displays::DataLens,
          'pulse' => ::Cetera::Displays::Pulse,
          'draft' => ::Cetera::Displays::Draft,
          'story' => ::Cetera::Displays::Story,

          'dataset' => ::Cetera::Displays::Dataset,
          'chart' => ::Cetera::Displays::Chart,
          'map' => ::Cetera::Displays::Map,
          'calendar' => ::Cetera::Displays::Calendar,
          'filter' => ::Cetera::Displays::Filter,
          'measure' => ::Cetera::Displays::Measure,

          # Cetera is replacing type 'href' with type 'link',
          'href' => ::Cetera::Displays::Link,
          'federated_href' => ::Cetera::Displays::Link,
          'link' => ::Cetera::Displays::Link,

          'file' => ::Cetera::Displays::File,
          'form' => ::Cetera::Displays::Form,
          'api' => ::Cetera::Displays::Api
        }
      end

      def display
        display_map.fetch(type) do |bad_type|
          raise "Bad result type for Cetera: #{bad_type}" if Rails.env.development?
          airbrake_type_error(bad_type)
          ::Cetera::Displays::Base
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

      def data_lens?
        type == 'datalens'
      end

      def is_public?
        !!@metadata['is_public']
      end

      def story?
        type == 'story'
      end

      def domain_icon_href
        "/api/domains/#{domainCName}/icons/smallIcon"
      end

      # Note that this somewhat duplicates view.get_preview_image_url.
      def get_preview_image_url(cookie_string, request_id)
        if story?
          Storyteller.get_tile_image(id, cookie_string, request_id)
        else
          previewImageUrl
        end
      end
    end
  end
end
