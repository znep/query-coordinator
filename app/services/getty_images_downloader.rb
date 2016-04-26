# A service object to download Getty Images associated with a
# specific Story.
class GettyImagesDownloader
  COMPONENTS = ['hero', 'image', 'author']
  GETTY_IMAGE_API_FORMAT = /\/stories\/api\/v1\/getty-images\/(.+)/

  attr_reader :user, :story

  def initialize(story, user)
    raise 'A valid draft or published story is required.' unless story.is_a?(DraftStory) || story.is_a?(PublishedStory)
    raise 'A valid user object is required.' unless user && user['id']

    @story = story
    @user = user
  end

  def download
    urls.each do |url|
      id = getty_id(url)
      getty_image = GettyImage.find_or_initialize_by(getty_id: id)
      getty_image.download(user, story.uid)
    end
  end

  private

  attr_reader :draft_story

  def draft_story
    @draft_story ||= (DraftStory.find_by_uid(story.uid).as_json || {})
  end

  def urls
    draft_story['blocks'].
      map { |block| block['components'] }.
      flatten.
      select { |component| contains_getty_image(component) }.
      map { |component| component_url(component) }
  end

  def component_url(component)
    case component['type']
      when 'hero', 'image'
        component['value']['url']
      when 'author'
        component['value']['image']['url']
      else
        raise StandardError("Cannot derive component URI from type, #{component['type']}")
    end
  end

  def getty_id(url)
    $1 if url =~ GETTY_IMAGE_API_FORMAT
  end

  def contains_getty_image(component)
    COMPONENTS.include?(component['type']) &&
    GETTY_IMAGE_API_FORMAT.match(component_url(component)) != nil
  end
end
