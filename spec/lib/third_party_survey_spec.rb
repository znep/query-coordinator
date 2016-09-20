require 'rails_helper'

describe ThirdPartySurvey do
  subject do
    Class.new do
      include ThirdPartySurvey

      attr_accessor :current_domain, :current_user

      def render(ignored)
      end
    end.new
  end

  before(:each) do
    allow(subject).to receive(:render)
  end

  context 'config is not present' do
    before(:each) { setup_spec }

    context 'qualtrics' do
      it 'does not render' do
        expect(subject).to_not receive(:render)
        subject.render_qualtrics_survey('nope')
      end
    end

    context 'userzoom' do
      it 'does not render' do
        expect(subject).to_not receive(:render)
        subject.render_userzoom_survey('nope')
      end
    end
  end

  context 'feature flag disabled' do
    before(:each) { setup_spec(true, false, false) }

    context 'qualtrics' do
      it 'does not render' do
        allow(APP_CONFIG).to receive(:qualtrics).and_return({
          'admin' => {
            'survey_id' => 'my-id'
          }
        })
        expect(subject).to_not receive(:render)
        subject.render_qualtrics_survey('admin')
      end
    end

    context 'userzoom' do
      it 'does not render' do
        allow(APP_CONFIG).to receive(:userzoom).and_return({
          'cuid' => 'my-cuid',
          'admin' => {
            'id' => 'my-id',
            'sid' => 'my-sid'
          }
        })
        expect(subject).to_not receive(:render)
        subject.render_userzoom_survey('admin')
      end
    end
  end

  context 'user is member of domain' do
    before(:each) { setup_spec }

    context 'qualtrics' do
      it 'renders if config is present' do
        allow(APP_CONFIG).to receive(:qualtrics).and_return({
          'admin' => {
            'survey_id' => 'my-id'
          }
        })
        subject.render_qualtrics_survey('admin')
        expect(subject).to have_received(:render).with(hash_including(
          :partial => 'templates/third_party_survey_scripts/qualtrics',
          :locals => {
            :qualtrics_survey_id => 'my-id'
          }
        ))
      end
    end

    context 'userzoom' do
      it 'renders if config is present' do
        allow(APP_CONFIG).to receive(:userzoom).and_return({
          'cuid' => 'my-cuid',
          'admin' => {
            'id' => 'my-id',
            'sid' => 'my-sid'
          }
        })
        subject.render_userzoom_survey('admin')
        expect(subject).to have_received(:render).with(hash_including(
          :partial => 'templates/third_party_survey_scripts/userzoom',
          :locals => {
            :userzoom_cuid => 'my-cuid',
            :userzoom_id => 'my-id',
            :userzoom_sid => 'my-sid'
          }
        ))
      end
    end
  end

  context 'user is not member of domain' do
    before(:each) { setup_spec(false) }

    context 'qualtrics' do
      it 'does not render if config is present' do
        allow(APP_CONFIG).to receive(:qualtrics).and_return({
          'cuid' => 'my-cuid',
          'admin' => {
            'id' => 'my-id',
            'sid' => 'my-sid'
          }
        })
        subject.render_qualtrics_survey('admin')
        expect(subject).to_not have_received(:render)
      end
    end

    context 'userzoom' do
      it 'does not render if config is present' do
        allow(APP_CONFIG).to receive(:userzoom).and_return({
          'cuid' => 'my-cuid',
          'admin' => {
            'id' => 'my-id',
            'sid' => 'my-sid'
          }
        })
        subject.render_userzoom_survey('admin')
        expect(subject).to_not have_received(:render)
      end
    end
  end

  def setup_spec(is_member = true, is_qualtrics_enabled = true, is_userzoom_enabled = true)
    current_domain = double(:member? => is_member)
    allow(FeatureFlags).to receive(:derive).and_return(OpenStruct.new(
      :enable_third_party_survey_qualtrics => is_qualtrics_enabled,
      :enable_third_party_survey_userzoom => is_userzoom_enabled
    ))
    allow(subject).to receive(:current_domain).and_return(current_domain)
  end
end
