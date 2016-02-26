require 'rails_helper'

describe Userzoom do

  let(:userzoom) do
    Class.new do
      include Userzoom

      attr_accessor :current_domain, :current_user
      def render(options)
      end
    end.new
  end

  it 'should not render if config is not present' do
    expect(userzoom.render_userzoom_survey('nope')).to be_nil
  end

  context 'user is member of domain' do
    before(:each) do
      current_domain = double(:member? => true)
      allow(userzoom).to receive(:current_domain).and_return(current_domain)
      allow(userzoom).to receive(:render)
    end

    it 'should render if config is present' do
      allow(APP_CONFIG).to receive(:userzoom).and_return({
        'cuid' => 'my-cuid',
        'admin' => {
          'id' => 'my-id',
          'sid' => 'my-sid'
        }
      })
      userzoom.render_userzoom_survey('admin')
      expect(userzoom).to have_received(:render).with(hash_including(
        :partial => 'templates/userzoom_survey_script',
        :locals => {
          :userzoom_cuid => 'my-cuid',
          :userzoom_id => 'my-id',
          :userzoom_sid => 'my-sid'
        }
      ))
    end
  end

  context 'user is not member of domain' do
    before(:each) do
      current_domain = double(:member? => false)
      allow(userzoom).to receive(:current_domain).and_return(current_domain)
      allow(userzoom).to receive(:render)
    end

    it 'should not render if config is present' do
      allow(APP_CONFIG).to receive(:userzoom).and_return({
        'cuid' => 'my-cuid',
        'admin' => {
          'id' => 'my-id',
          'sid' => 'my-sid'
        }
      })
      userzoom.render_userzoom_survey('admin')
      expect(userzoom).to_not have_received(:render)
    end
  end
end
