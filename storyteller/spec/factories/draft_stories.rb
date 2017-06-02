FactoryGirl.define do

  factory :draft_story do
    uid 'test-test'
    block_ids []
    theme 'serif'
    created_by 'test_user@socrata.com'

    factory :draft_story_with_blocks do
      transient do
        block_count 2
      end

      after(:build) do |story, evaluator|
        evaluator.block_count.times do
          story.block_ids.push(FactoryGirl.create(:block).id)
        end
      end
    end

    factory :draft_story_with_image_components do
      after(:build) do |story|
        story.block_ids.push(
          FactoryGirl.create(:block_with_image).id,
          FactoryGirl.create(:block_with_hero).id,
          FactoryGirl.create(:block_with_author).id
        )
      end
    end

    factory :draft_story_with_getty_image do
      after(:build) do |story|
        story.block_ids.push(
          FactoryGirl.create(:block_with_getty_image).id,
          FactoryGirl.create(:block).id
        )
      end
    end

    factory :draft_story_with_legacy_getty_image do
      after(:build) do |story|
        story.block_ids.push(
          FactoryGirl.create(:block_with_legacy_getty_image).id
        )
      end
    end
  end
end
