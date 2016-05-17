module DatasetLandingPageHelper
  def meta_description
    if @view.description.present?
      "#{@view.name} - #{@view.description}"
    else
      @view.name
    end
  end

  def dataset_landing_page_translations
    LocaleCache.render_translations([LocalePart.dataset_landing_page])['dataset_landing_page'].
      merge({
        data_types: LocaleCache.render_translations([LocalePart.core.data_types])['core']['data_types']
      })
  end

  def render_dataset_landing_page_translations
    javascript_tag("var I18n = #{json_escape(dataset_landing_page_translations.to_json)};")
  end

  def render_mixpanel_config
    mixpanel_config = {
      :token => APP_CONFIG.mixpanel_token
    }

    if CurrentDomain.feature?(:mixpanelTracking)
      mixpanel_config[:options] = {:cookie_expiration => nil}
    elsif CurrentDomain.feature?(:fullMixpanelTracking)
      mixpanel_config[:options] = {:cookie_expiration => 365}
    else
      mixpanel_config[:disable] = true
    end
    javascript_tag("var mixpanelConfig = #{json_escape(mixpanel_config.to_json)};")
  end

  def render_session_data
    session_data = {
      :userId => current_user.try(:id) || 'N/A',
      :ownerId => @view.try(:owner).try(:id) || 'N/A',
      :userOwnsDataset => @view.owned_by?(current_user),
      :socrataEmployee => current_user.try(:is_admin?) || false,
      :userRoleName => current_user.try(:roleName) || 'N/A',
      :viewId => @view.try(:id) || 'N/A'
    }

    javascript_tag("var sessionData = #{json_escape(session_data.to_json)};")
  end

  def render_current_user
    if current_user
      javascript_tag("var currentUser = #{json_escape(current_user.to_json)};")
    end
  end

  def share_facebook_url
    "http://www.facebook.com/sharer/sharer.php?u=#{@view.encoded_seo_friendly_url(request)}"
  end

  def share_twitter_url
    if @view.attribution
      text = "#{@view.name} | #{CurrentDomain.strings.company}"
    else
      text = "#{@view.name}"
    end

    text = ERB::Util.url_encode(text)

    "http://twitter.com/share?text=#{text}&url=#{@view.encoded_seo_friendly_url(request)}"
  end

  def share_email_url
    subject = @view.name

    body = I18n.t(
      'dataset_landing_page.share.email_body',
      :provider => CurrentDomain.strings.company,
      :url => @view.encoded_seo_friendly_url(request)
    )

    "mailto:?subject=#{subject}&body=#{body}"
  end

  def transformed_formats
    if @view.is_geospatial? || @view.is_api_geospatial?
      return [ 'KML', 'KMZ', 'Shapefile', 'Original', 'GeoJSON' ]
    end

    formats = [ 'csv', 'csv_for_excel', 'json', 'rdf', 'rss', 'xml' ]

    if FeatureFlags.derive(nil, request).enable_pdf_download_type
      formats.push('pdf')
    end

    if FeatureFlags.derive(nil, request).enable_xls_download_type
      formats.push('xls')
      formats.push('xlsx')
    end

    formats
  end

  def custom_metadata_fieldsets
    custom_metadata = @view.merged_metadata['custom_fields']

    return nil if custom_metadata.blank?

    merge_custom_metadata(@view).select do |fieldset|
      fieldset.fields.present? && fieldset.fields.any? do |field|
        (custom_metadata[fieldset.name] || {})[field.name].present?
      end
    end.map do |fieldset|
      fieldset.merge(existing_fields: custom_metadata.try(:assoc, fieldset.name).try(:[], 1) || {})
    end
  end

  def attachments
    if @view.metadata && @view.metadata.attachments.present?
      @view.metadata.attachments.map do |attachment_data|
        attachment = Attachment.set_up_model(attachment_data)
        {
          :name => attachment.displayName,
          :href => attachment.href(@view.id),
          :link => link_to(attachment.displayName, attachment.href(@view.id), :target => '_blank')
        }
      end
    end
  end

  def transformed_view
    if !view.is_geospatial?
      row_count = @view.row_count
    end

    {
      :id => @view.id,
      :name => @view.name,
      :description => @view.description,
      :category => @view.category,
      :attribution => @view.attribution,
      :rowLabel => @view.row_label,
      :columns => @view.columns,
      :isPrivate => !@view.is_public?,
      :isGeospatial => @view.is_geospatial?,
      :gridUrl => data_grid_path(@view),
      :downloadOverride => @view.downloadOverride,
      :exportFormats => transformed_formats,
      :lastUpdatedAt => @view.time_last_updated_at,
      :dataLastUpdatedAt => @view.time_data_last_updated_at,
      :metadataLastUpdatedAt => @view.time_metadata_last_updated_at,
      :createdAt => @view.time_created_at,
      :geospatialChildLayers => transformed_child_layers,
      :rowCount => row_count,
      :apiFoundryUrl => @view.api_foundry_url,
      :resourceUrl => @view.resource_url,
      :odataUrl => @view.odata_url,
      :facebookShareUrl => share_facebook_url,
      :twitterShareUrl => share_twitter_url,
      :emailShareUrl => share_email_url,
      :viewCount => @view.viewCount,
      :downloadCount => @view.downloadCount,
      :ownerName => @view.owner.displayName,
      :customMetadataFieldsets => custom_metadata_fieldsets,
      :attachments => attachments,
      :tags => @view.tags,
      :licenseName => @view.license.try(:name),
      :attributionLink => @view.attributionLink,
      :statsUrl => stats_url
    }
  end

  def stats_url
    if (@view.user_granted?(current_user) || CurrentDomain.user_can?(current_user, UserRights::EDIT_OTHERS_DATASETS))
      view_stats_path(@view)
    end
  end

  def transformed_featured_views
    @featured_views.map do |featured_view|
      {
        :name => featured_view.name,
        :id => featured_view.id,
        :description => sanitize(featured_view.description),
        :url => featured_view.seo_friendly_url,
        :displayType => featured_view.display.try(:type),
        :updatedAt => featured_view.time_last_updated_at,
        :viewCount => featured_view.viewCount,
        :isPrivate => !featured_view.is_public?
      }
    end
  end

  def transformed_child_layers
    @view.geospatial_child_layers.map do |child_layer|
      {
        :id => child_layer.id,
        :name => child_layer.name,
        :columns => child_layer.columns,
        :isGeospatial => true,
        :apiFoundryUrl => child_layer.api_foundry_url,
        :resourceUrl => child_layer.resource_url,
        :odataUrl => child_layer.odata_url,
        :rowLabel => child_layer.row_label,
        :rowCount => child_layer.row_count
      }
    end
  end
end
