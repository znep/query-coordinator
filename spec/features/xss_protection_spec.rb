require 'rails_helper'

shared_examples 'a secure application' do
  describe 'View mode' do
    before do
      visit "/s/magic-thing/#{attack_story_uid}"
    end
    it 'should not evaluate JS' do
      expect(page.evaluate_script('window.xssFailure')).to eq(nil)
    end
  end

  describe 'Preview mode' do
    before do
      visit "/s/magic-thing/#{attack_story_uid}/preview"
    end
    it 'should not evaluate JS' do
      expect(page.evaluate_script('window.xssFailure')).to eq(nil)
    end
  end

  describe 'Edit mode' do
    before do
      visit "/s/magic-thing/#{attack_story_uid}/edit"
    end
    it 'should not evaluate JS' do
      expect(page.evaluate_script('window.xssFailure')).to eq(nil)
    end
  end
end

# This entire test is attempting to prove a negative.
# Tread lightly. This was TDDd and was verified to fail before
# the fixes were put in place.
RSpec.describe 'XSS protection', type: :feature, js: true do
  let(:view_metadata) { {} }

  before do
    stub_logged_in_user

    story = FactoryGirl.build(:draft_story, uid: attack_story_uid) do |story|
      story.block_ids = story_blocks.map(&:id)
    end
    story.save!

    published_story = PublishedStory.from_draft_story(story)
    published_story.created_by = '11'
    published_story.save!

    stub_core_view(attack_story_uid, view_metadata)
  end


  describe 'attacks against the html component' do
    # A selection of HTML-based attacks.
    # Many of these come from
    # https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
    let(:html_component_attacks) do
      [
        '<script>window.xssFailure = "simple script tag injection"</script>',
        '</script><script>window.xssFailure="premature script close"</script>',
        '<img src="javascript:window.xssFailure = \'img src script injection\'">',
        '<IMG """><SCRIPT>window.xssFailure = "malformed IMG tag script injection"</SCRIPT>">',
        '<<SCRIPT>window.xssFailure = "extraneous open brackets script injection";//<</SCRIPT>',
        '<BODY onload="window.xssFailure=\'body.onload event injection\'">',
        '<DIV STYLE="width: expression(window.xssFailure=\'style expression script injection\');">',
        '<!--[if gte IE 4]>\n<SCRIPT>window.xssFailure = "ie comment conditional script injection"</SCRIPT>\n<![endif]-->'
      ]
    end

    let(:story_blocks) do
      html_component_attacks.map do |attack_markup|
        FactoryGirl.create(
          :block,
          { components: [ { type: 'html', value: attack_markup } ] }
        )
      end
    end

    let(:attack_story_uid) { 'html-doom' }

    it_behaves_like 'a secure application'
  end

  describe 'attacks against the youtube component' do
    let(:story_blocks) do
      evil_youtube_value = {
        id: '"><script>window.xssFailure=true</script>'
      }

      [
        FactoryGirl.create(
          :block,
          { components: [ { type: 'youtube.video', value: evil_youtube_value } ] }
        )
      ]
    end

    let(:attack_story_uid) { 'ytub-doom' }

    it_behaves_like 'a secure application'
  end

  describe 'attacks against the story metadata' do
    let(:view_metadata) {
      evil_title = '"><script>window.xssFailure="title injection"</script>'
      evil_description = '"><script>window.xssFailure="description injection"</script>'

      {
        name: evil_title,
        description: evil_description
      }
    }

    let(:story_blocks) do
      []
    end

    let(:attack_story_uid) { 'mtda-doom' }

    it_behaves_like 'a secure application'
  end

end
