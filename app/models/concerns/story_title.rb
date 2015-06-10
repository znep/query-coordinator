module StoryTitle
  extend ActiveSupport::Concern

  included do

    attr_accessor :title

    def title
      @title ||= 'Test Story'
    end
  end
end
