FactoryGirl.define do

  factory :block do
    layout '12'
    components { [ { type: 'html', value: 'Hello, world!' } ] }
    created_by 'test_user@socrata.com'
  end

  factory :block_with_image, class: Block do
    layout '12'
    components { [ { type: 'image', value: { url: 'http://example.com/image.jpg' } } ] }
    created_by 'test_user@socrata.com'
  end
end
