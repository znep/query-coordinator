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
end
