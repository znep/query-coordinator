require 'rails_helper'

describe NotificationsHelper do
  describe '#zendesk_article_to_notification' do
    zendesk_article = {
      'title' => 'Disrupt tofu succulents everyday',
      'html_url' => 'https://socrata.com',
      'body' => '<script>alert("hi");</script><img src="cool.png" />Hella migas, art party YOLO kombucha live-edge heirloom sriracha lomo mixtape paleo flannel. Humblebrag flexitarian semiotics pour-over, tbh tattooed farm-to-table',
      'epoch_time' => 12345678
    }

    it 'should sanitize body html' do
      notification = zendesk_article_to_notification(zendesk_article, nil)

      expect(notification[:body]).to start_with 'Hella migas, art party YOLO kombucha'
    end

    it 'should shorten body' do
      notification = zendesk_article_to_notification(zendesk_article, nil)

      expect(notification[:body].length).to be(150)
    end

    it 'marks as unread when last seen is nil' do
      notification = zendesk_article_to_notification(zendesk_article, nil)

      expect(notification[:isUnread]).to be(true)
    end

    it 'marks as unread when last seen is before article time' do
      notification = zendesk_article_to_notification(zendesk_article, 12345677)

      expect(notification[:isUnread]).to be(true)
    end

    it 'marks as read when last seen is after article time' do
      notification = zendesk_article_to_notification(zendesk_article, 12345679)

      expect(notification[:isUnread]).to be(false)
    end
  end

  describe '#parse_zendesk_dates' do
    it 'should parse dates properly' do
      news = {}
      news['articles'] = [
        { 'updated_at' => '2016-05-01T00:00:00Z' },
        { 'updated_at' => '2250-01-01T16:20:00Z' },
        { 'updated_at' => '1992-03-23T10:10:10Z' }
      ]

      parse_zendesk_dates(news)

      expect(news['articles'][0]['parsed_datetime']).to eq ' 1 May 2016'
      expect(news['articles'][1]['parsed_datetime']).to eq ' 1 Jan 2250'
      expect(news['articles'][2]['parsed_datetime']).to eq '23 Mar 1992'
    end
  end

  describe '#query_zendesk' do
    it 'gets articles and parses their dates' do
      VCR.use_cassette('zendesk_articles') do
        articles = query_zendesk

        expect(articles['articles'].length).to eq 4

        # we actually parse the dates to be a specific format since zendesk returns... not what we want
        articles['articles'].each do |article|
          expect(article['parsed_datetime']).not_to be_nil
          expect(article['epoch_time']).not_to be_nil
        end
      end
    end

    it 'gets notifications from zendesk' do
      class FakeUser
        def lastNotificationSeenAt
          0
        end
      end

      class FakeUserSession
        def user
          FakeUser.new
        end
      end

      allow_any_instance_of(UserAuthMethods).to receive(:current_user_session).and_return(FakeUserSession.new)


      VCR.use_cassette('zendesk_articles') do
        notifications = notifications_from_zendesk

        expect(notifications.length).to eq 4

        notifications.each do |notification|
          expect(notification[:title]).not_to be_nil
          expect(notification[:titleLink]).not_to be_nil
          expect(notification[:body]).not_to be_nil
          expect(notification[:dateTime]).not_to be_nil
          expect(notification[:isUnread]).to be true
        end
      end
    end
  end
end
