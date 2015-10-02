require 'rails_helper'

# This entire test is attempting to prove a negative.
# Tread lightly. This was TDDd and was verified to fail before
# the fixes were put in place.
RSpec.describe 'XSS protection', type: :feature, js: true do
  before do
    stub_logged_in_user
  end

  # A selection of HTML-based attacks.
  # Many of these come from
  # https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
  let(:html_component_attacks) do
    [
      '<script>window.xssFailure = "simple script tag injection"</script>',
      '<img src="javascript:window.xssFailure = \'img src script injection\'">',
      '<IMG """><SCRIPT>window.xssFailure = "malformed IMG tag script injection"</SCRIPT>">',
      '<<SCRIPT>window.xssFailure = "extraneous open brackets script injection";//<</SCRIPT>',
      '<BODY onload="window.xssFailure=\'body.onload event injection\'">',
      '<DIV STYLE="width: expression(window.xssFailure=\'style expression script injection\');">',
      '<!--[if gte IE 4]>\n<SCRIPT>window.xssFailure = "ie comment conditional script injection"</SCRIPT>\n<![endif]-->'
    ]
  end

  describe 'attacks against the html component' do
    let!(:attack_story_uid) do
      story = FactoryGirl.build(:draft_story, uid: 'html-doom') do |story|
        html_component_attacks.each do |attack_markup|
          story.block_ids.push(FactoryGirl.create(
            :block,
            { components: [ { type: 'html', value: attack_markup } ] }
          ).id)
        end
      end
      story.save!

      published_story = PublishedStory.from_draft_story(story)
      published_story.created_by = '11'
      published_story.save!

      stub_core_view(story.uid)

      story.uid
    end

    describe 'View mode' do
      before do
        visit "/s/magic-thing/#{attack_story_uid}"
      end
      it 'should not evaluate JS' do
        # This assertion is really to make sure the page is fully loaded.
        expect(page.all('.block').length).to eq(html_component_attacks.length)

        expect(page.evaluate_script('window.xssFailure')).to eq(nil)
      end
    end

    describe 'Preview mode' do
      before do
        visit "/s/magic-thing/#{attack_story_uid}/preview"
      end
      it 'should not evaluate JS' do
        # This assertion is really to make sure the page is fully loaded.
        expect(page.all('.block').length).to eq(html_component_attacks.length)

        expect(page.evaluate_script('window.xssFailure')).to eq(nil)
      end
    end

    describe 'Edit mode' do
      before do
        visit "/s/magic-thing/#{attack_story_uid}/edit"
      end
      it 'should not evaluate JS' do
        # This assertion is really to make sure the page is fully loaded.
        expect(page.all('.block').length).to eq(html_component_attacks.length)

        expect(page.evaluate_script('window.xssFailure')).to eq(nil)
      end
    end
  end

  describe 'attacks against the youtube component' do
    let!(:attack_story_uid) do
      evil_youtube_value = {
        id: '"><script>window.xssFailure=true</script>'
      }

      story = FactoryGirl.build(:draft_story, uid: 'ytub-doom') do |story|
        story.block_ids.push(FactoryGirl.create(
          :block,
          { components: [ { type: 'youtube.video', value: evil_youtube_value } ] }
        ).id)
      end
      story.save!

      published_story = PublishedStory.from_draft_story(story)
      published_story.created_by = '11'
      published_story.save!

      stub_core_view(story.uid)

      story.uid
    end

    describe 'View mode' do
      before do
        visit "/s/magic-thing/#{attack_story_uid}"
      end
      it 'should not evaluate JS' do
        # This assertion is really to make sure the page is fully loaded.
        expect(page.all('.block').length).to eq(1)

        expect(page.evaluate_script('window.xssFailure')).to eq(nil)
      end
    end

    describe 'Preview mode' do
      before do
        visit "/s/magic-thing/#{attack_story_uid}/preview"
      end
      it 'should not evaluate JS' do
        # This assertion is really to make sure the page is fully loaded.
        expect(page.all('.block').length).to eq(1)

        expect(page.evaluate_script('window.xssFailure')).to eq(nil)
      end
    end

    describe 'Edit mode' do
      before do
        visit "/s/magic-thing/#{attack_story_uid}/edit"
      end
      it 'should not evaluate JS' do
        # This assertion is really to make sure the page is fully loaded.
        expect(page.all('.block').length).to eq(1)

        expect(page.evaluate_script('window.xssFailure')).to eq(nil)
      end
    end
  end

  describe 'attacks against the story metadata' do
    let!(:attack_story_uid) do
      evil_title = '"><script>window.xssFailure="title injection"</script>'
      evil_description = '"><script>window.xssFailure="description injection"</script>'

      story = FactoryGirl.build(:draft_story, uid: 'titl-doom')
      story.save!

      published_story = PublishedStory.from_draft_story(story)
      published_story.created_by = '11'
      published_story.save!

      stub_core_view(
        story.uid,
        name: evil_title,
        description: evil_description
      )

      story.uid
    end

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


  describe 'attacks against story JSON' do
    let!(:attack_story_uid) do
      evil_json = '</script><script>window.xssFailure=true</script>'

      story = FactoryGirl.build(:draft_story, uid: 'json-doom') do |story|
        story.block_ids.push(FactoryGirl.create(
          :block,
          { components: [ { type: 'html', value: evil_json } ] }
        ).id)
      end
      story.save!

      published_story = PublishedStory.from_draft_story(story)
      published_story.created_by = '11'
      published_story.save!

      stub_core_view(story.uid)

      story.uid
    end

    describe 'Edit mode' do
      before do
        visit "/s/magic-thing/#{attack_story_uid}/edit"
      end
      it 'should not evaluate JS' do
        # This assertion is really to make sure the page is fully loaded.
        expect(page.all('.block').length).to eq(1)


        expect(page.evaluate_script('window.xssFailure')).to eq(nil)
      end
    end
  end

  
end
