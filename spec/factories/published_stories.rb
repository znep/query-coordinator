FactoryGirl.define do

  factory :published_story do
    four_by_four 'test-test'
    block_ids []
    created_by 'test_user@socrata.com'

    factory :published_story_with_blocks do
      transient do
        block_count 2
      end

      after(:build) do |story, evaluator|
        evaluator.block_count.times do
          story.block_ids.push(FactoryGirl.create(:block).id)
        end
      end
    end
  end
end
