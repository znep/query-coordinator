FactoryGirl.define do

  factory :block do
    layout '12'
    components { [ { type: 'html', value: 'Hello, world!' } ] }
    created_by 'test_user@socrata.com'
    presentable true
  end

  factory :block_with_image, class: Block do
    layout '12'
    components { [ { type: 'image', value: { documentId: 1, url: 'http://example.com/image.jpg' } } ] }
    created_by 'test_user@socrata.com'
  end

  factory :block_with_hero, class: Block do
    layout '12'
    components { [ { type: 'hero', value: { documentId: 2, url: 'http://example.com/hero-image.jpg' } } ] }
    created_by 'test_user@socrata.com'
  end

  factory :block_with_author, class: Block do
    layout '12'
    components do
      [{
        type: 'author',
        value: {
          image: {
            documentId: 3,
            url: 'http://example.com/hero-image.jpg'
          }
        }
      }]
    end
    created_by 'test_user@socrata.com'
  end

  factory :block_with_getty_image, class: Block do
    layout '12'
    components {
      [
        { type: 'hero', value: { url: '/stories/api/v1/getty-images/2392020' } },
        { type: 'author', value: { blurb: 'Hello!', image: { url: '/stories/api/v1/getty-images/203920', documentId: nil } } }
      ]
    }
    created_by 'test_user@socrata.com'
  end
end
