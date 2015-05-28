FactoryGirl.define do

  factory :draft_story do
    four_by_four 'test-test'
    blocks []
    created_by 'test_user@socrata.com'
    created_at { Time.now }
  end

  factory :draft_story_with_block, class: DraftStory do
    four_by_four 'test-test'
    blocks { [ FactoryGirl.bulid(:block) ] }
    created_by 'test_user@socrata.com'
    created_at { Time.now }
  end
end
