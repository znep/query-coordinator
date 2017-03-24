require 'rails_helper'

describe AdministrationHelper do

  include TestHelperMethods

  class DummyClass
    include AdministrationHelper

    # define a stub here because the normal current_user stubbing
    # is meant to be used with controllers, apparently
    def current_user ; end
  end

  let(:dummy_class_instance) { DummyClass.new }
  let(:user) { double('User') }

  before do
    init_current_domain
    allow(dummy_class_instance).to receive(:current_user).and_return(user)
  end

  context '#show_site_appearance_admin_panel?' do
    it 'returns false if the user is not permitted to use site chrome' do
      allow(user).to receive(:can_use_site_appearance?).and_return(false)
      expect(dummy_class_instance.show_site_appearance_admin_panel?).to eq(false)
    end

    it 'returns true for permitted users' do
      allow(user).to receive(:can_use_site_appearance?).and_return(true)
      stub_site_chrome
      stub_site_chrome_custom_content
      VCR.use_cassette('admin_custom_content') do
        expect(dummy_class_instance.show_site_appearance_admin_panel?).to eq(true)
      end
    end
  end
end