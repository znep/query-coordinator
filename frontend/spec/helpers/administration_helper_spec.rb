require 'rails_helper'

describe AdministrationHelper do
  describe '#form_button' do

    it 'generates a form tag' do
      expect(helper.form_button('/', 'text')).to match(/^<form/)
    end
  end

  describe '#form_checkbox_button' do
    let(:options) { { :url_opts => '/', :id => 'wombats' } }

    it 'generates a submit tag when not disabled' do
      options[:disabled] = false
      expect(helper.form_checkbox_button(options)).to match(/submit/)
    end

    it 'displays an enabled checkbox when not disabled' do
      options[:disabled] = false
      expect(helper.form_checkbox_button(options)).to_not match(/disabled/)
    end

    it 'does not generate a submit tag when disabled' do
      options[:disabled] = true
      expect(helper.form_checkbox_button(options)).to_not match(/submit/)
    end

    it 'displays a disabled checkbox when disabled' do
      options[:disabled] = true
      expect(helper.form_checkbox_button(options)).to match(/disabled/)
    end

    it 'displays a check when checked' do
      options[:checked] = true
      expect(helper.form_checkbox_button(options)).to match(/icon-check/)
    end

    it 'does not display a check when not checked' do
      options[:checked] = false
      expect(helper.form_checkbox_button(options)).to match(/unchecked/)
    end
  end

  describe 'a11y_metadata_fieldset_summary' do
    it 'returns an a11y_summary with non-empty "fields" value' do
      metadata_fields = { 'fields' => [ { 'name' => 'anemone' } ] }
      columns = []
      expect(helper.a11y_metadata_fieldset_summary(metadata_fields, columns))
    end

    it 'returns an a11y_summary with empty "fields" value' do
      metadata_fields = { }
      columns = []
      expect(helper.a11y_metadata_fieldset_summary(metadata_fields, columns))
    end
  end

  describe '#select_for_role' do
    let(:stories_enabled) { true }

    before do
      allow(User).
        to receive(:roles_list).
        and_return(['test_role', 'publisher_stories', 'editor_stories'])

      feature_flag_mock = double('feature_flag_mock')

      allow(FeatureFlags).
        to receive(:derive).
        and_return(feature_flag_mock)

      allow(feature_flag_mock).
        to receive(:stories_enabled).
        and_return(stories_enabled)
    end

    describe 'when stories_enabled is true' do
      it 'returns a <select> with Storyteller roles' do
        select = helper.select_for_role 'id'

        expect(select).to include('<option value="publisher_stories">')
        expect(select).to include('<option value="editor_stories">')
        expect(select).to include('test_role')
      end
    end

    describe 'when stories_enabled is false' do
      let(:stories_enabled) { false }

      it 'returns a <select> with Storyteller roles disabled' do
        select = helper.select_for_role 'id'

        expect(select).to include('<option value="publisher_stories" disabled>')
        expect(select).to include('<option value="editor_stories" disabled>')
        expect(select).to include('test_role')
      end
    end
  end

  describe 'user_can_see_content_section?', :verify_stubs => false do
    before do
      allow(helper).to receive(:user_can_see_routing_approval?).and_return(false)
      allow(helper).to receive(:user_can_see_view_moderation?).and_return(false)
      allow(helper).to receive(:user_can_see_comment_moderation?).and_return(false)
      allow(helper).to receive(:user_can_see_view_moderation?).and_return(false)
      allow(helper).to receive(:can_view_georegions_admin?).and_return(false)
      allow(helper).to receive(:user_can_see_home_page?).and_return(false)
      allow(helper).to receive(:user_can_see_canvas_designer?).and_return(false)
      allow(helper).to receive(:user_can_review_approvals?).and_return(false)
    end

    it 'returns true when user_can_see_routing_approval? is true' do
      expect(helper.user_can_see_content_section?).to eq(false)
    end

    it 'returns true when user_can_see_routing_approval? is true' do
      allow(helper).to receive(:user_can_see_routing_approval?).and_return(true)
      expect(helper.user_can_see_content_section?).to eq(true)
    end

    it 'returns true when user_can_see_view_moderation? is true' do
      allow(helper).to receive(:user_can_see_view_moderation?).and_return(true)
      expect(helper.user_can_see_content_section?).to eq(true)
    end

    it 'returns true when user_can_see_comment_moderation? is true' do
      allow(helper).to receive(:user_can_see_comment_moderation?).and_return(true)
      expect(helper.user_can_see_content_section?).to eq(true)
    end

    it 'returns true when user_can_see_view_moderation? is true' do
      allow(helper).to receive(:user_can_see_view_moderation?).and_return(true)
      expect(helper.user_can_see_content_section?).to eq(true)
    end

    it 'returns true when can_view_georegions_admin? is true' do
      allow(helper).to receive(:can_view_georegions_admin?).and_return(true)
      expect(helper.user_can_see_content_section?).to eq(true)
    end

    it 'returns true when user_can_see_home_page? is true' do
      allow(helper).to receive(:user_can_see_home_page?).and_return(true)
      expect(helper.user_can_see_content_section?).to eq(true)
    end

    it 'returns true when user_can_see_canvas_designer? is true' do
      allow(helper).to receive(:user_can_see_canvas_designer?).and_return(true)
      expect(helper.user_can_see_content_section?).to eq(true)
    end

    it 'returns true when user_can_review_approvals? is true' do
      allow(helper).to receive(:user_can_review_approvals?).and_return(true)
      expect(helper.user_can_see_content_section?).to eq(true)
    end
  end
end
