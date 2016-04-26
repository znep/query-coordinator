require 'rails_helper'

RSpec.describe Api::V1::GettyImagesController, type: :controller do

  describe '#show' do
    let(:getty_image) { nil }
    let(:getty_image_id) { nil }

    let(:params) do
      { id: getty_image_id }
    end

    before do
      allow(controller).to receive(:getty_image).and_return(getty_image)
    end

    describe 'when authenticated' do
      before do
        stub_valid_session
      end

      describe 'when the ID maps to an image' do
        let(:getty_image) { FactoryGirl.create(:getty_image) }
        let(:getty_image_id) { getty_image.id }

        it 'redirects to the image URL' do
          get :show, params
          expect(response).to be_redirect
        end
      end

      describe 'when the ID does not map to an image' do
        let(:getty_image) { nil }
        let(:getty_image_id) { 'doesnotexist' }

        it '404s' do
          get :show, params
          expect(response).to have_http_status(:not_found)
        end
      end
    end

    describe 'when unauthenticated' do
      let(:getty_image_id) { 'doesnotmatter' }

      before do
        stub_invalid_session
      end

      it 'redirects' do
        get :show, params
        expect(response).to be_redirect
      end
    end
  end

  describe '#search' do
    let(:page) { 10 }
    let(:phrase) { 'phrase' }
    let(:page_size) { 20 }

    let(:params) do
      {
        :phrase => phrase,
        :page => page,
        :page_size => page_size
      }
    end

    shared_examples 'renders a bad search request' do
      it 'renders a bad request' do
        get :search, params
        expect(response.status).to eq(400)
      end
    end

    describe 'when authenticated' do
      before do
        stub_valid_session
      end

      describe 'when missing phrase' do
        it_behaves_like 'renders a bad search request' do
          let(:phrase) { nil }
        end
      end

      describe 'when missing page' do
        it_behaves_like 'renders a bad search request' do
          let(:page) { nil }
        end
      end

      describe 'when missing page_size' do
        it_behaves_like 'renders a bad search request' do
          let(:page_size) { nil }
        end
      end

      describe 'with acceptable parameters' do
        describe 'with a workable connection to Getty Images' do
          let(:metadata) { [{}] }

          before do
            search_workflow = double('search_workflow', :execute => metadata)
            allow(controller).to receive(:search_workflow).and_return(search_workflow)
          end

          it 'returns metadata' do
            get :search, params
            expect(response.body).to eq(metadata.to_json)
          end
        end

        describe 'with a non-workable connection to Getty Images' do
          before do
            allow(controller).to receive(:search_workflow).and_raise('Hello, Error!')
          end

          it 'renders a 400' do
            get :search, params
            expect(response.status).to eq(400)
          end
        end
      end
    end

    describe 'when unauthenticated' do
      before do
        stub_invalid_session
      end

      it 'redirects' do
        get :search, params
        expect(response).to be_redirect
      end
    end
  end
end
