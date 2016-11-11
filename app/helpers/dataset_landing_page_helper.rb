module DatasetLandingPageHelper
  include Socrata::UrlHelpers

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

  def render_dataset_landing_page_session_data
    session_data = {
      :userId => current_user.try(:id) || 'N/A',
      :ownerId => @view.try(:owner).try(:id) || 'N/A',
      :userOwnsDataset => @view.owned_by?(current_user),
      :socrataEmployee => current_user.try(:is_superadmin?) || false,
      :userRoleName => current_user.try(:roleName) || 'N/A',
      :viewId => @view.try(:id) || 'N/A',
      :email => current_user.try(:email).to_s
    }

    javascript_tag("var sessionData = #{json_escape(session_data.to_json)};")
  end

  def render_dataset_landing_page_server_config
    # Figure out if we need a locale prefix on links
    locale_prefix = (I18n.locale.to_sym == CurrentDomain.default_locale.to_sym) ? '' : "/#{I18n.locale}"

    feature_flags = FeatureFlags.derive(nil, request).slice(
      :enable_dataset_landing_page_tour,
      :display_dataset_landing_page_preview_images,
      :stories_enabled
    ).map { |k, v| [ k.camelize(:lower), v ] }.to_h

    server_config = {
      :airbrakeKey => ENV['DATASET_LANDING_PAGE_AIRBRAKE_API_KEY'] || APP_CONFIG.dataset_landing_page_airbrake_api_key,
      :csrfToken => form_authenticity_token.to_s,
      :currentUser => current_user,
      :domain => CurrentDomain.cname,
      :environment => Rails.env,
      :featureFlags => feature_flags,
      :locale => I18n.locale.to_s,
      :localePrefix => locale_prefix.to_s,
      :recaptchaKey => RECAPTCHA_2_SITE_KEY
    }

    javascript_tag("var serverConfig = #{json_escape(server_config.to_json)};")
  end

  def share_facebook_url
    "http://www.facebook.com/sharer/sharer.php?u=#{encoded_seo_friendly_url(@view, request)}"
  end

  def share_twitter_url
    if @view.attribution
      text = "#{@view.name} | #{CurrentDomain.strings.company}"
    else
      text = "#{@view.name}"
    end

    text = ERB::Util.url_encode(text)

    "http://twitter.com/share?text=#{text}&url=#{encoded_seo_friendly_url(@view, request)}"
  end

  def share_email_url
    subject = @view.name

    body = I18n.t(
      'dataset_landing_page.share.email_body',
      :provider => CurrentDomain.strings.company,
      :url => encoded_seo_friendly_url(@view, request)
    )

    "mailto:?subject=#{subject}&body=#{body}"
  end

  def stats_url
    if (@view.user_granted?(current_user) || CurrentDomain.user_can?(current_user, UserRights::EDIT_OTHERS_DATASETS))
      view_stats_path(@view)
    end
  end

  def bootstrap_url
    if @view.newBackend?
      new_data_lens_path(:id => @view.id)
    else
      begin
        new_data_lens_path(:id => @view.migrations['nbeId'])
      rescue CoreServer::ConnectionError => e
        nil
      end
    end
  end

  def edit_metadata_url
    if @view.has_rights?(ViewRights::UPDATE_VIEW)
      edit_view_metadata_path(@view)
    end
  end

  def export_formats
    [ 'csv', 'csv_for_excel', 'json', 'rdf', 'rss', 'tsv_for_excel', 'xml']
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
        attachment = Attachment.setup_model(attachment_data)
        {
          :name => attachment.displayName,
          :href => attachment.href(@view.id),
          :link => link_to(attachment.displayName, attachment.href(@view.id), :target => '_blank')
        }
      end
    end
  end

  def sort_order
    query = @view.metadata && @view.metadata.json_query
    order = query.try(:[], 'order').try(:first)

    # If query exists and the columnFieldName is part of existing columns
    # then use the custom query
    if query && @view.columns.map(&:fieldName).include?(order['columnName'] || order['columnFieldName'])
      order['columnName'] = order['columnName'] || order['columnFieldName']
      [order]
    else
      # Default to sorting by the first column
      [{
        :ascending => true,
        :columnName => @view.columns.try(:first).try(:fieldName)
      }]
    end
  end

  def row_label
    @view.row_label || I18n.t('dataset_landing_page.default_row_label').capitalize
  end

  def transformed_view
    columns = @view.columns.reject do |column|
      # disregard system columns that aren't hidden, i.e. computed columns
      column.fieldName.start_with?(':') ||
      # disregard columns hidden by user
      column.flag?('hidden')
    end

    row_count = @view.row_count rescue 0
    if @view.description
      description = @view.description.gsub(/\r?\n/, '<br />')
      description = Rinku.auto_link(description, :all, 'target="_blank" rel="nofollow external"')
    end

    # This makes an HTTP request, so we want to avoid it if possible
    can_publish = @view.can_publish? if @view.is_unpublished?

    {
      :id => @view.id,
      :name => @view.name,
      :description => description,
      :category => @view.category,
      :attribution => @view.attribution,
      :rowLabel => row_label,
      :rowLabelMultiple => row_label.pluralize(2),
      :columns => columns,
      :isPrivate => !@view.is_public?,
      :isUnpublished => @view.is_unpublished?,
      :canPublish => can_publish,
      :isTabular => @view.is_tabular?,
      :isHref => @view.is_href?,
      :isBlobby => @view.is_blobby?,
      :blobId => @view.blobId,
      :blobFilename => @view.blobFilename,
      :blobMimeType => @view.blobMimeType,
      :blobType => @view.is_blobby? && @view.display.display_type,
      :gridUrl => data_grid_path(@view),
      :exportFormats => export_formats,
      :lastUpdatedAt => @view.time_last_updated_at,
      :dataLastUpdatedAt => @view.time_data_last_updated_at,
      :metadataLastUpdatedAt => @view.time_metadata_last_updated_at,
      :createdAt => @view.time_created_at,
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
      :allAccessPoints => @view.allAccessPoints,
      :tags => @view.tags,
      :licenseName => @view.license.try(:name),
      :licenseLink => @view.license.try(:termsLink),
      :licenseLogo => @view.license.try(:logoUrl),
      :attributionLink => @view.attributionLink,
      :statsUrl => stats_url,
      :editMetadataUrl => edit_metadata_url,
      :editUrl => edit_view_path(@view),
      :sortOrder => sort_order,
      :bootstrapUrl => bootstrap_url,
      :metadata => @view.metadata
    }
  end
end
