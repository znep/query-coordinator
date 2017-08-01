# A helper class that provides methods to fetch data commonly used in the dataset landing page.
class DatasetLandingPage
  class << self
    include Rails.application.routes.url_helpers
    include ActionView::Helpers::UrlHelper
    include Socrata::UrlHelpers
    include DatasetsHelper

    def fetch_all(view, current_user, cookies, request_id, request)
      threads = {}

      threads[:can_publish] = Thread.new { fetch_can_publish(view) }
      threads[:migrations] = Thread.new { fetch_migrations(view) }

      # Wait for migrations request to complete before continuing
      threads[:migrations].join

      # We need to set locale for worker threads to maintain locale in seo friendly links
      locale = I18n.locale

      # We fetch 4 related views so we know if there are more than 3
      threads[:related_views] = Thread.new {
        begin
          I18n.locale = locale
          fetch_derived_views(view, cookies, request_id, 4, 0)
        rescue Exception => e
          Rails.logger.error("Error fetching derived views for #{view.id}: #{e.message}")
          []
        end
      }

      threads[:featured_content] = Thread.new {
        begin
          I18n.locale = locale
          fetch_featured_content(view, cookies, request_id)
        rescue Exception => e
          Rails.logger.error("Error fetching featured content for #{view.id}: #{e.message}")
          []
        end
      }

      # Wait for all requests to complete
      threads.each_value(&:join)

      results = Hash[threads.map { |key, thread| [ key, thread.value ] } ]

      # Transform the view for browser

      columns = view.columns.reject do |column|
        # disregard system columns that aren't hidden, i.e. computed columns
        column.fieldName.start_with?(':') ||
          # disregard columns hidden by user
          column.flag?('hidden')
      end

      if view.description
        description = view.description.gsub(/\r?\n/, '<br />')
        description = Rinku.auto_link(description, :all, 'target="_blank" rel="nofollow external"')
      end

      results[:dataset_landing_page_view] = {
        :allAccessPoints => view.allAccessPoints,
        :apiFoundryUrl => view.api_foundry_url,
        :attachments => attachments(view),
        :attribution => view.attribution,
        :attributionLink => view.attributionLink,
        :blobFilename => view.blobFilename,
        :blobId => view.blobId,
        :blobMimeType => view.blobMimeType,
        :blobType => view.is_blobby? && view.display.display_type,
        :bootstrapUrl => bootstrap_url(view, results[:migrations], request),
        :canPublish => threads[:can_publish].value,
        :cartoUrl => view.carto_url,
        :category => view.category,
        :columns => columns,
        :commentUrl => comment_url(view),
        :createdAt => view.time_created_at,
        :csvResourceUrl => view.csv_resource_url(request),
        :customMetadataFieldsets => custom_metadata_fieldsets(view),
        :dataLastUpdatedAt => view.time_data_last_updated_at,
        :description => description,
        :disableContactDatasetOwner => disable_contact_dataset_owner(view),
        :downloadCount => view.downloadCount,
        :editMetadataUrl => edit_metadata_url(view),
        :editUrl => edit_view_path(view),
        :emailShareUrl => share_email_url(view),
        :exportFormats => export_formats,
        :facebookShareUrl => share_facebook_url(view),
        :geoJsonResourceUrl => view.geojson_resource_url(request),
        :gridUrl => data_grid_path(view),
        :id => view.id,
        :isBlobby => view.is_blobby?,
        :isHref => view.is_href?,
        :isPrivate => !view.is_public?,
        :isTabular => view.is_tabular?,
        :isUnpublished => view.is_unpublished?,
        :lastUpdatedAt => view.time_last_updated_at,
        :licenseLink => view.license.try(:termsLink),
        :licenseLogo => view.license.try(:logoUrl),
        :licenseName => view.license.try(:name),
        :metadata => view.metadata,
        :metadataLastUpdatedAt => view.time_metadata_last_updated_at,
        :name => view.name,
        :namedResourceUrl => view.named_resource_url,
        :odataUrl => view.odata_url,
        :ownerName => view.owner.displayName,
        :plotlyUrl => view.plotly_url,
        :provenance => view.provenance,
        :resourceUrl => view.resource_url,
        :rowLabel => row_label(view),
        :rowLabelMultiple => row_label(view).pluralize(2, I18n.locale),
        :statsUrl => stats_url(view, current_user),
        :tags => view.tags,
        :twitterShareUrl => share_twitter_url(view),
        :viewCount => view.viewCount
      }

      results
    end

    def fetch_can_publish(view)
      if !view.is_unpublished?
        false
      else
        view.can_publish? rescue false
      end
    end

    def fetch_migrations(view)
      view.migrations rescue nil
    end

    # Our different search services accept different sort_by values.
    # Cly: name, date, most_accessed
    # Cetera: relevance, most_accessed, alpha/name, newest/date, oldest, last_modified
    def fetch_derived_views(view, cookie_string, request_id, limit = nil, offset = nil, sort_by = 'most_accessed', locale = nil)
      view = View.find(view) if view.is_a?(String)

      return [] if view.nil?

      # TODO use the asset_selector endpoint instead of calling two different services
      if view.is_public?
        options = {
          :limit => limit,
          :offset => offset,
          :locale => locale,
          :sortBy => sort_by,
          :boostStories => 1.3,
          :boostDatalenses => 1.15
        }.compact

        derived_views = Cetera::Utils.get_derived_from_views(
          cetera_uid(view), request_id, cookie_string, options
        )
      else
        derived_views = view.find_dataset_landing_page_related_content(sort_by) || []
        limit = limit || derived_views.length
        derived_views = derived_views.slice(offset.to_i, limit.to_i) || []
      end

      # We are using threads here because stories need to issue a separate request for its
      # preview image and (until Cetera returns the previewImageId) we also need to issue
      # a request to Core for the previewImageId of non-stories views. To speed things up,
      # we're making these requests with threads and then formatting the view widget. If
      # Cetera is ever able to return the preview image url for either a story or a view,
      # then we can remove these threads.
      preview_image_urls = {}
      preview_image_url_request_threads = derived_views.map do |view|
        Thread.new do
          preview_image_urls[view.id] = view.get_preview_image_url(cookie_string, request_id)
        end
      end
      preview_image_url_request_threads.each(&:join)

      derived_views.map { |view| format_view_widget(view, preview_image_urls[view.id]) }
    end

    def fetch_featured_content(view, cookie_string, request_id)
      view = View.find(view) if view.is_a?(String)

      return [] if view.nil?

      featured_content = view.featured_content.reject do |featured_item|
        # featuredView isn't always guaranteed to exist on internal featured content. If it
        # doesn't exist, though, we don't have any information to render for the view widget.
        featured_item['contentType'] == 'internal' && !featured_item['featuredView']
      end

      # We are using threads here because stories need to issue a separate request for its
      # preview image and (until Cetera returns the previewImageId) we also need to issue
      # a request to Core for the previewImageId of non-stories views. To speed things up,
      # we're making these requests with threads and then formatting the view widget. If
      # Cetera is ever able to return the preview image url for either a story or a view,
      # then we can remove these threads.
      preview_image_urls = {}
      preview_image_url_request_threads = featured_content.map do |featured_item|
        Thread.new do
          if featured_item['contentType'] == 'internal'
            featured_view = View.setup_model(featured_item['featuredView'])
            image_url = featured_view.get_preview_image_url(cookie_string, request_id)

            preview_image_urls[featured_view.id] = image_url
          end
        end
      end
      preview_image_url_request_threads.each(&:join)

      featured_content.map do |featured_item|
        image_url = nil

        if featured_item['contentType'] == 'internal'
          image_url = preview_image_urls[featured_item['featuredView']['id']]
        end

        format_featured_item(featured_item, image_url)
      end
    end

    def add_featured_content(view, featured_item, cookie_string, request_id)
      view_id = view.is_a?(View) ? view.id : view

      path = "/views/#{view_id}/featured_content.json"
      result = JSON.parse(CoreServer::Base.connection.create_request(path, featured_item))
      image_url = nil

      if result['contentType'] == 'internal'
        featured_view = View.setup_model(result['featuredView'])
        image_url = featured_view.get_preview_image_url(cookie_string, request_id)
      end

      format_featured_item(result, image_url)
    end

    def delete_featured_content(uid, item_position)
      path = "/views/#{uid}/featured_content/#{item_position}"
      # Response format: {"contentType"=>"internal", "lensId"=>16, "position"=>2, "title"=>"A Datalens"}
      response = JSON.parse(CoreServer::Base.connection.delete_request(path))
    end

    def get_formatted_view_widget_by_id(uid, cookie_string, request_id)
      view = View.find(uid)
      image_url = view.get_preview_image_url(cookie_string, request_id)
      format_view_widget(view, image_url)
    end

    # Formats either a View object instantiated from View json (from api/views) or
    # a Cetera::Results::ResultRow object instantiated from Cetera json results into a
    # payload that the View Widget component can use.
    #
    # View json example: {
    #   "createdAt": 1446141533,
    #   "rowsUpdatedAt": 1446141473
    # }
    #
    # Cetera json example: {
    #   "resource": {
    #     "updatedAt": "2016-06-30T01:13:00.000Z",
    #     "createdAt": "2014-11-06T11:39:23.000Z"
    #   },
    #   "link": "https://data.cityofnewyork.us/d/axxb-u7uv"
    # }
    def format_view_widget(view, image_url = nil)
      formatted_view = {
        :name => view.name,
        :id => view.id,
        :description => view.description,
        :url => view.try(:link) && localized_dataset_url(view.link) || seo_friendly_url(view),
        :displayType => view.display.try(:type),
        :createdAt => view.try(:time_created_at) || view.createdAt,
        :updatedAt => view.try(:time_last_updated_at) || view.updatedAt,
        :viewCount => view.viewCount || 0,
        :isPrivate => !view.is_public?,
        :imageUrl => image_url
      }

      if view.story?
        formatted_view[:url] = view.try(:link) || "https:#{view_url(view)}"
      end

      formatted_view
    end

    def format_featured_item(featured_item, image_url = nil)
      result = if featured_item['contentType'] == 'internal'
        featured_item.merge(
          :featuredView => format_view_widget(View.setup_model(featured_item['featuredView']), image_url)
        )
      else
        featured_item
      end

      if result['previewImageId'].present?
        result['previewImage'] = result['previewImageId']
      elsif result['previewImage'].present?
        result['previewImageId'] = result['previewImage']
      end

      result
    end

    # TODO: Remove this OBE/NBE juggling once Cetera returns the same results for both 4x4s
    def cetera_uid(view)
      if view.newBackend?
        begin
          # Cetera uses the OBE id for indexing. It will not return results for a NBE id if
          # a dataset has an OBE version, so we have to use the OBE id if it exists.
          view.migrations['obeId']
        rescue CoreServer::ConnectionError
          view.id
        end
      else
        view.id
      end
    end

    private

    def share_facebook_url(view)
      "http://www.facebook.com/sharer/sharer.php?u=#{encoded_seo_friendly_url(view, nil)}"
    end

    def share_twitter_url(view)
      if view.attribution
        text = "#{view.name} | #{CurrentDomain.strings.company}"
      else
        text = "#{view.name}"
      end

      text = ERB::Util.url_encode(text)

      "http://twitter.com/share?text=#{text}&url=#{encoded_seo_friendly_url(view, nil)}"
    end

    def share_email_url(view)
      subject = view.name

      body = I18n.t(
        'dataset_landing_page.share.email_body',
        :provider => CurrentDomain.strings.company,
        :url => encoded_seo_friendly_url(view, nil)
      )

      "mailto:?subject=#{subject}&body=#{body}"
    end

    def stats_url(view, current_user)
      if (view.user_granted?(current_user) || CurrentDomain.user_can?(current_user, UserRights::EDIT_OTHERS_DATASETS))
        view_stats_path(view)
      end
    end

    def bootstrap_url(view, migrations, request)
      return unless view.newBackend? || migrations.present?

      bootstrap_id = view.newBackend? ? view.id : migrations['nbeId']

      if enable_visualization_canvas?(view, request)
        create_visualization_canvas_path(id: bootstrap_id)
      else
        new_data_lens_path(id: bootstrap_id)
      end
    end

    def edit_metadata_url(view)
      if view.has_rights?(ViewRights::UPDATE_VIEW)
        edit_view_metadata_path(view)
      end
    end

    def comment_url(view)
      "#{data_grid_path(view)}?pane=feed" if view.module_enabled?(:allow_comments)
    end

    def export_formats
      %w(csv csv_for_excel csv_for_excel_europe json rdf rss tsv_for_excel xml)
    end

    def custom_metadata_fieldsets(view)
      custom_metadata = view.merged_metadata['custom_fields']

      return nil if custom_metadata.blank?

      merge_custom_metadata(view).select do |fieldset|
        fieldset.fields.present? && fieldset.fields.any? do |field|
          (custom_metadata[fieldset.name] || {})[field.name].present?
        end
      end.map do |fieldset|
        fieldset.merge(existing_fields: custom_metadata.try(:assoc, fieldset.name).try(:[], 1) || {})
      end
    end

    def attachments(view)
      if view.metadata && view.metadata.attachments.present?
        view.metadata.attachments.map do |attachment_data|
          attachment = Attachment.setup_model(attachment_data)
          {
            :name => attachment.displayName,
            :href => attachment.href(view.id),
            :link => link_to(attachment.displayName, attachment.href(view.id), :target => '_blank')
          }
        end
      end
    end

    def row_label(view)
      view.row_label || I18n.t('common.default_row_label').capitalize
    end

    def disable_contact_dataset_owner(view)
      CurrentDomain.feature?(:disable_contact_dataset_owner)
    end

    def enable_visualization_canvas?(view, request)
      enable_visualization_canvas = FeatureFlags.derive(view, request).enable_visualization_canvas
    end
  end
end
