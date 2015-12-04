require 'rails_helper'

RSpec.describe ThemesController, type: :controller do

  describe '#custom' do
    let(:themes) { [double('theme')] }

    before do
      allow(Theme).to receive(:all_custom_for_current_domain).and_return(themes)
    end

    context 'for unauthenticated user' do
      before do
        stub_invalid_session
      end

      it 'is 200' do
        get :custom, format: :css
        expect(response).to be_success
      end

      it 'renders css' do
        get :custom, format: :css
        expect(response.content_type).to eq('text/css')
      end

      it 'renders custom template' do
        get :custom, format: :css
        expect(response).to render_template('custom')
      end

      it 'assigns @custom_themes' do
        get :custom, format: :css
        expect(assigns(:custom_themes)).to eq(themes)
      end
    end
  end
end
