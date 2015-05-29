require 'rails_helper'

RSpec.describe 'published stories routing', type: :routing do
  it 'supports vanity text' do
    four_by_four = '52my-2pac'
    vanity_text = 'let_me_tell_you_a_story'

    # NOTE: Should be /stories/v/#{vanity_text}/#{four_by_four},
    # but RSpec routing tests seem to ignore relative_url_root.
    expect(get: "/v/#{vanity_text}/#{four_by_four}").to route_to(
      controller: 'published_stories',
      action: 'show',
      four_by_four: four_by_four,
      vanity_text: vanity_text
    )
  end

  it 'requires a 4x4 when using a vanity URL' do
    bad_four_by_four = 'not-afourbyfour'

    # NOTE: Should be /stories/v/vanity_text/#{bad_four_by_four},
    # but RSpec routing tests seem to ignore relative_url_root.
    expect(get: "/v/vanity_text/#{bad_four_by_four}").to_not be_routable
  end

  it 'supports no vanity text' do
    four_by_four = '52my-2pac'

    # NOTE: Should be /stories/v/#{four_by_four},
    # but RSpec routing tests seem to ignore relative_url_root.
    expect(get: "/v/#{four_by_four}").to route_to(
      controller: 'published_stories',
      action: 'show',
      four_by_four: four_by_four
    )
  end

  it 'requires a 4x4 when using a non-vanity URL' do
    bad_four_by_four = 'really_im_not_a_fourbyfour'

    # NOTE: Should be /stories/v/#{bad_four_by_four},
    # but RSpec routing tests seem to ignore relative_url_root.
    expect(get: "/v/#{bad_four_by_four}").to_not be_routable
  end
end
