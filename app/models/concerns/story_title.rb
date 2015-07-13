module StoryTitle
  extend ActiveSupport::Concern

  included do

    attr_accessor :title

    def title
      @title ||= 'Untitled Story'
    end
  end
end
