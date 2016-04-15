module DatasetLandingPageHelper
  def view_last_updated
    Time.at(@view.last_activity).strftime('%B %-d, %Y')
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
end
