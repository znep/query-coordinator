require 'rss'
require 'open-uri'

class HomeController < ApplicationController
  def index
    @body_class = 'home'
    
    blists = Lens.find()
    
    @recently_opened_blists = blists.sort { |a,b|
      b.lastOpenedDate <=> a.lastOpenedDate
    }.slice(0..1)
    
    @favorite_blists = blists.find_all { |b|
      b.flag?("favorite")
    }.sort { |a,b|
      b.lastOpenedDate <=> a.lastOpenedDate
    }.slice(0..1)
    
    @contacts = Contact.find().slice(0..2)
    
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
