module DatasetLandingPageHelper
  def format_date(date)
    date.strftime('%B %-d, %Y')
  end

  def format_number(number)
    number_with_delimiter(number)
  end

  def view_created_at
    format_date(Time.at(@view.createdAt))
  end

  def data_last_updated_at
    format_date(Time.at(@view.rowsUpdatedAt))
  end

  def metadata_last_updated_at
    format_date(Time.at(@view.viewLastModified))
  end

  def view_last_updated_at
    format_date(Time.at(@view.last_activity))
  end

  def seo_friendly_url
    ERB::Util.url_encode(request.base_url + view_path(@view.route_params))
  end

  def share_facebook_url
    "http://www.facebook.com/sharer/sharer.php?u=#{seo_friendly_url}"
  end

  def share_twitter_url
    if @view.attribution
      text = "#{@view.name} | #{CurrentDomain.strings.company}"
    else
      text = "#{@view.name}"
    end

    text = ERB::Util.url_encode(text)

    "http://twitter.com/share?text=#{text}&url=#{seo_friendly_url}"
  end

  def share_email_url
    subject = @view.name

    body = I18n.t(
      'dataset_landing_page.share.email_body',
      :provider => CurrentDomain.strings.company,
      :url => seo_friendly_url
    )

    "mailto:?subject=#{subject}&body=#{body}"
  end

  def export_formats
    if @view.is_geospatial? || @view.is_api_geospatial?
      return [
        { :url => @view.geo_download_path('KML'), :label => 'KML' },
        { :url => @view.geo_download_path('KMZ'), :label => 'KMZ' },
        {
          :url => @view.geo_download_path('Shapefile'),
          :label => I18n.t('dataset_landing_page.download.shapefile')
        },
        {
          :url => @view.geo_download_path('Original'),
          :label => I18n.t('dataset_landing_page.download.original')
        },
        { :url => @view.geo_download_path('GeoJSON'), :label => 'GeoJSON' }
      ]
    end

    formats = [
      { :url => @view.download_path('csv'), :label => 'CSV' },
      {
        :url => @view.download_path('csv', :bom => true),
        :label => I18n.t('dataset_landing_page.download.csv_for_excel')
      },
      { :url => @view.download_path('json'), :label => 'JSON' },
      { :url => @view.download_path('rdf'), :label => 'RDF' },
      { :url => @view.download_path('rss'), :label => 'RSS' },
      { :url => @view.download_path('xml'), :label => 'XML' }
    ]

    if FeatureFlags.derive(nil, request).enable_pdf_download_type
      formats.push({ :url => @view.download_path('pdf'), :label => 'PDF' })
    end

    if FeatureFlags.derive(nil, request).enable_xls_download_type
      formats.push({ :url => @view.download_path('xls'), :label => 'XLS' })
      formats.push({ :url => @view.download_path('xlsx'), :label => 'XLSX' })
    end

    formats
  end

  def tag_links
    (@view.tags || []).map.with_index { |tag, index|
      query = { :tag => tag }.to_query
      url = "/browse?#{query}"
      content = link_to(tag, url)
      content += ', ' if index < @view.tags.length - 1
      raw("<span>#{content}</span>")
    }.join('')
  end

  def row_label
    @view.metadata.try(:rowLabel)
  end
end
