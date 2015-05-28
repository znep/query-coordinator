class PublishedStory < ActiveRecord::Base
  include StoryValidations
  include BlockOperations

end
