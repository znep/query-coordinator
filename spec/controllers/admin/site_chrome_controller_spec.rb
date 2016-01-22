require 'rails_helper'

RSpec.describe Admin::SiteChromesController, type: :controller do

  context 'when user is unauthenticated' do
    before do
      stub_invalid_session
    end

    it 'access to #edit is forbidden' do
      get :edit
      expect(response).to be_redirect
    end
  end

  context 'when signed-in user is not super admin' do
    before do
      stub_valid_session
    end

    it 'access to #edit is forbidden' do
      get :edit
      expect(response).to be_redirect
    end
  end

  context 'when signed-in user is super admin' do
    let(:site_chrome_config) { {} }
    let(:site_chrome) { SiteChrome.new(site_chrome_config) }

    before do
      allow(SiteChrome).to receive(:for_current_domain).and_return(site_chrome)
      stub_super_admin_session
    end

    describe '#edit' do
      before do
        get :edit
      end

      it 'renders edit template' do
        expect(response).to render_template('edit')
      end

      context 'when no site_chrome config exists' do
        it 'assigns new site_chrome config' do
          expect(assigns[:site_chrome]).to be_a(SiteChrome)
          expect(assigns[:site_chrome]).to_not be_persisted
        end
      end

      context 'when site_chrome config exists' do
        let(:site_chrome_config) do
          {
            'id' => 328,
            'styles' => {
              'bg-color' => '#abcdef',
              'font-color' => '#012345'
            },
            'content' => {
              'logoUrl' => 'http://s3.bucket.com/images/001/logo.png',
              'logoAltText' => 'Bob Loblaw\'s Law Blog',
              'friendlySiteName' => 'Bob Loblaw\'s Law Blog'
            },
            'updated_at' => '9827349872',
            'domain_cname' => 'hothamwater.com',
            'persisted' => true
          }
        end

        it 'assigns existing site_chrome config' do
          expect(assigns[:site_chrome]).to be_persisted
          expect(assigns[:site_chrome]).to eq(site_chrome)
        end
      end
    end

    describe '#update' do
      let(:site_chrome_attrs) do
        {
          'styles' => {
            '$bg-color' => '#foo',
            '$font-color' => '#bar'
          },
          'content' => {
            'logoUrl' => 'http://bukk.it/effthis.gif',
            'logoAltText' => 'Nuh uh',
            'friendlySiteName' => 'We\'ve done the impossible, and that makes us mighty.'
          }
        }
      end

      before do
        allow(CoreServer).to receive(:create_or_update_configuration).and_return({})
      end

      it 'assigns @site_chrome' do
        put :update, site_chrome: site_chrome_attrs
        expect(assigns[:site_chrome]).to eq(site_chrome)
      end

      it 'merges request host into params' do
        request.host = 'somehostname.com'
        expected = site_chrome_attrs.merge('domain_cname' => 'somehostname.com')
        expect(site_chrome).to receive(:update_attributes).with(expected)
        put :update, site_chrome: site_chrome_attrs
      end

      context 'when success' do
        before do
          put :update, site_chrome: site_chrome_attrs
        end

        it 'sets flash success' do
          expect(flash[:success]).to eq('Successfully updated site chrome config')
        end

        it 'redirects to edit' do
          expect(response).to redirect_to(action: 'edit')
        end
      end

      context 'with invalid attributes' do
        before do
          allow(CoreServer).to receive(:create_or_update_configuration).and_return({ 'error' => 'true', 'message' => 'error' })
          put :update, site_chrome: site_chrome_attrs
        end

        it 'renders edit template' do
          put :update, site_chrome: site_chrome_attrs
          expect(response).to render_template('edit')
        end

        it 'sets flash error' do
          put :update, site_chrome: site_chrome_attrs
          expect(flash[:error]).to_not be_blank
        end
      end
    end
  end

end
