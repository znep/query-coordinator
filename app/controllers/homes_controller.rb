require 'rss'
require 'open-uri'

class HomesController < ApplicationController
  def show
    @body_class = 'home'

    blists = View.find()

    @recently_opened_blists = blists.sort { |a,b|
      b.last_viewed <=> a.last_viewed
    }.slice(0..1)

    @favorite_blists = blists.find_all { |b|
      b.flag?("favorite")
    }.sort { |a,b|
      b.last_viewed <=> a.last_viewed
    }.slice(0..1)

    @contacts_activities = Activity.find({:maxResults => 3, :inNetwork => true})

    begin
      rss = RSS::Parser.parse(BLIST_RSS, false)
      @feed_items = rss.items.sort { |a,b|
        b.pubDate <=> a.pubDate
      }.slice(0..2)
    rescue StandardError => err
      logger.fatal("Cannot open the feed: " + err)
    ensure
      @feed_items = Hash.new unless @feed_items
    end

  end
end
