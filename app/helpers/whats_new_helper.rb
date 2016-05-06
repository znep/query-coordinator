require 'zendesk2'

# This just provides a 'retrieve_news' method that gets news
# from zendesk (for now)
module WhatsNewHelper
  def retrieve_news
    news = Rails.cache.read('whats-new')
    news.nil? ? query_zendesk : news
  end

  private

  # this zendesk library allows creating mocks, so optionally
  # you can pass in a mocked client; eventually, we might
  # want to write better tests to check that things work
  # properly
  def query_zendesk(zendesk_client = Zendesk2::Client.new(
    url: 'https://support.socrata.com', username: '', token: ''
  ))
    begin
      section_id = APP_CONFIG.whats_new.fetch(:zendesk_section)
      per_page = APP_CONFIG.whats_new.fetch(:article_count)

      news = zendesk_client.get_help_center_sections_articles(
        locale: 'en-us',
        section_id: section_id, sort_by: 'created_at',
        per_page: per_page, page: 1
      ).body

      parse_dates news

      Rails.cache.write('whats-new', news, expires_in: 15.minutes)
    rescue => e
      news = { 'articles' => [] }
      puts "Error getting news from Zendesk: #{e.inspect}"
    end

    news
  end

  def parse_dates(news)
    # go through and parse the date on each article
    news['articles'].each do |article|
      article['parsed_datetime'] = Date.parse(article['updated_at'])
                                       .strftime('%e %b %Y')
    end
  end
end
