module NotificationsHelper
  include UserAuthMethods

  def retrieve_zendesk_news
    news = Rails.cache.read('zendesk-notifications')
    news.nil? ? query_zendesk : news
  end

  def notifications_from_zendesk
    zendesk_news = retrieve_zendesk_news

    last_seen = current_user_session.user.lastNotificationSeenAt

    # translate the zendesk articles into what the notifications JS expects
    notifications = zendesk_news['articles'].map do |article|
      zendesk_article_to_notification(article, last_seen)
    end

    notifications
  end

  private

  # this zendesk library allows creating mocks, so optionally
  # you can pass in a mocked client; eventually, we might
  # want to write better tests to check that things work
  # properly
  def query_zendesk(zendesk_client = Zendesk2.new(
    url: 'https://support.socrata.com', username: '', token: ''
  ))
    begin
      section_id = APP_CONFIG.zendesk_notifications.fetch(:zendesk_section)
      per_page = APP_CONFIG.zendesk_notifications.fetch(:article_count)

      news = zendesk_client.get_help_center_sections_articles(
        locale: 'en-us',
        section_id: section_id, sort_by: 'created_at',
        per_page: per_page, page: 1
      ).body

      parse_zendesk_dates news

      Rails.cache.write('zendesk-notifications', news, expires_in: 15.minutes)
    rescue => e
      news = { 'articles' => [] }
      puts "Error getting news from Zendesk: #{e.inspect}"
    end

    news
  end

  def parse_zendesk_dates(news)
    # go through and parse the date on each article
    news['articles'].each do |article|
      article['parsed_datetime'] = Time.parse(article['updated_at']).to_s(:whats_new)
      article['epoch_time'] = Time.parse(article['updated_at']).to_i
    end
  end

  def zendesk_article_to_notification(article, last_seen)
    {
      id: article['id'].to_s,
      title: article['title'],
      titleLink: article['html_url'],
      body: ActionView::Base.full_sanitizer.sanitize(article['body'])[0..149],
      dateTime: article['epoch_time'],
      isUnread: last_seen.nil? ? true : last_seen < article['epoch_time']
    }
  end
end
