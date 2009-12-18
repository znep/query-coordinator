require 'rss'
require 'open-uri'
require 'timeout'

class HomesController < ApplicationController
  def show
    @body_class = 'home'

    blists = View.find()

    @recently_opened_blists = blists.sort { |a,b|
      b.last_viewed <=> a.last_viewed
    }.slice(0..4)

    @favorite_blists = blists.find_all { |b|
      b.flag?("favorite")
    }.sort { |a,b|
      b.last_viewed <=> a.last_viewed
    }.slice(0..4)

    @contacts_activities = Activity.find({:maxResults => 5, :inNetwork => true})

    @rss_feed = CurrentDomain.rss_feed
    @feed_items = nil
    @feed_url = nil
    if @rss_feed.present?
      begin
        Timeout::timeout(1) do
          rss = RSS::Parser.parse(@rss_feed, false)
          @feed_items = rss.items.sort { |a,b|
            b.pubDate <=> a.pubDate
          }.slice(0..2)

          @feed_url = rss.channel.link
        end
      rescue StandardError => err
        logger.fatal("Cannot open the feed: " + err)
      rescue Timeout::Error
        logger.warn("Timed out accessing #{CurrentDomain.rss_feed}")
      ensure
        @feed_items = Hash.new unless @feed_items
      end
    end

  end
end
