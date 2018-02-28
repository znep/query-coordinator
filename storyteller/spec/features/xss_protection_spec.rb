require 'rails_helper'

shared_examples 'a secure application' do

  self.use_transactional_fixtures = false

  describe 'View mode' do
    before do
      visit "/s/magic-thing/#{attack_story_uid}"
      Capybara.ignore_hidden_elements = false
    end

    after do
      Capybara.ignore_hidden_elements = true
    end

    it 'should not evaluate JS' do
      expect(page.evaluate_script('window.xssFailure')).to eq(nil)
      expect(page.html).to include('positive test')
    end
  end

  describe 'Preview mode' do
    before do
      visit "/s/magic-thing/#{attack_story_uid}/preview"
      Capybara.ignore_hidden_elements = false
    end

    after do
      Capybara.ignore_hidden_elements = true
    end

    it 'should not evaluate JS' do
      expect(page.evaluate_script('window.xssFailure')).to eq(nil)
      expect(page.html).to include('positive test')
    end
  end

  describe 'Edit mode' do
    before do
      visit "/s/magic-thing/#{attack_story_uid}/edit"
      Capybara.ignore_hidden_elements = false
    end

    after do
      Capybara.ignore_hidden_elements = true
    end

    it 'should not evaluate JS' do
      expect(page.evaluate_script('window.xssFailure')).to eq(nil)
      expect(page.html).to include('positive test')
    end
  end
end

# This entire test is attempting to prove a negative.
# Tread lightly. This was TDDd and was verified to fail before
# the fixes were put in place.
RSpec.describe 'XSS protection', type: :feature, js: true do
  let(:view_metadata) {
    evil_title = '"><script>window.xssFailure="title injection"</script>'
    evil_description = '"><script>window.xssFailure="description injection"</script>'

    {
      name: evil_title,
      description: evil_description
    }
  }

  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_current_domain
    stub_approvals_settings

    set_feature_flags('enable_getty_images_gallery' => true, 'use_fontana_approvals' => true)

    story = FactoryGirl.build(:draft_story, uid: attack_story_uid) do |story|
      story.block_ids = story_blocks.map(&:id)
    end
    story.save!

    published_story = PublishedStory.from_draft_story(story)
    published_story.created_by = '11'
    published_story.save!

    stub_core_view(attack_story_uid, view_metadata)
  end

  describe 'attacks against components' do
    # A selection of HTML-based attacks.
    # Many of these come from
    # https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
    let(:html_component_attack_blocks) do
      [
        '<script>window.xssFailure = "simple script tag injection"</script>',
        '</script><script>window.xssFailure="premature script close"</script>',
        '<img src="javascript:window.xssFailure = \'img src script injection\'">',
        '<IMG """><SCRIPT>window.xssFailure = "malformed IMG tag script injection"</SCRIPT>">',
        '<<SCRIPT>window.xssFailure = "extraneous open brackets script injection";//<</SCRIPT>',
        '<BODY onload="window.xssFailure=\'body.onload event injection\'">',
        '<DIV STYLE="width: expression(window.xssFailure=\'style expression script injection\');"><BR></DIV>',
        '<!--[if gte IE 4]>\n<SCRIPT>window.xssFailure = "ie comment conditional script injection"</SCRIPT>\n<![endif]-->'
      ].map do |attack_markup|
        FactoryGirl.create(
          :block,
          { layout: '6-6',
            components: [
              { type: 'html', value: attack_markup },
              { type: 'html', value: 'positive test' }
            ]
          }
        )
      end
    end

    let(:youtube_component_attack_blocks) do
      evil_youtube_value = {
        id: '"><script>window.xssFailure="youtube component"</script>'
      }

      [
        FactoryGirl.create(
          :block,
          { layout: '6-6',
            components: [
              { type: 'youtube.video', value: evil_youtube_value },
              { type: 'html', value: 'positive test' }
            ]
          }
        )
      ]
    end

    let(:story_blocks) do
      html_component_attack_blocks +
      youtube_component_attack_blocks
    end

    let(:attack_story_uid) { 'stry-doom' }

    it_behaves_like 'a secure application'
  end
end
