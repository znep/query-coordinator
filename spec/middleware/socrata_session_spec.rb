require 'socrata_session'

describe SocrataSession do

  let(:app) { double(:app) }
  let(:env) { Hash.new }
  let(:auth) { double('auth') }

  subject { SocrataSession.new(app) }

  it 'calls app with the same env hash' do
    expect(app).to receive(:call).with(env)
    subject.call(env)
  end

  context 'with a "socrata-csrf-token" key-value pair present in the request cookie' do

    let(:env) { env_with_csrf_token }
    let(:mock_current_user) do
      { id: 'four-four' }
    end


    before do
      expect(auth).to receive(:logged_in?).and_return(true)
      expect(auth).to receive(:current_user).and_return(mock_current_user)
    end

    it 'adds a "socrata-csrf-token" key-value pair to the Core request cookie' do

      expect(app).to receive(:call).with(env)
      expect(Core::Auth::Client).to receive(:new).with(
        anything,
        hash_including(
          :cookie => '_core_session_id=core321; socrata-csrf-token=rOCiUjEHDsMTx7+nPv05tOI6MVOXW4ZtlXlqJI7+Zuo='
        )
      ).and_return(auth)

      subject.call(env)
      env[SocrataSession::SOCRATA_SESSION_ENV_KEY].authenticate(env)
    end
  end

  context 'authenticate method' do

    context 'without any core session present in the cookies' do
      let(:env) { env_without_session }

      it 'returns nil' do
        expect(app).to receive(:call).with(
          hash_including(SocrataSession::SOCRATA_SESSION_ENV_KEY => respond_to(:authenticate))
        ) do |env_passed_to_app|
          expect(env_passed_to_app[SocrataSession::SOCRATA_SESSION_ENV_KEY].authenticate(env_passed_to_app)).to be_nil
        end

        subject.call(env)
      end
    end

    context 'with a core session present in the cookies' do

      let(:env) { env_with_session }

      before do
        allow(Core::Auth::Client).to receive(:new).and_return(auth)
      end

      context 'which is valid' do
        let(:mock_current_user) do
          { id: 'four-four' }
        end

        before do
          expect(auth).to receive(:logged_in?).and_return(true)
          expect(auth).to receive(:current_user).and_return(mock_current_user)
        end

        it 'returns the current user hash' do
          expect(app).to receive(:call).with(
            hash_including(SocrataSession::SOCRATA_SESSION_ENV_KEY => respond_to(:authenticate))
          ) do |env_passed_to_app|
            expect(env_passed_to_app[SocrataSession::SOCRATA_SESSION_ENV_KEY].authenticate(env_passed_to_app)).to equal(mock_current_user)
          end

          subject.call(env)
        end
      end

      context 'which is not valid' do

        before do
          expect(auth).to receive(:logged_in?).and_return(false)
        end

        it 'returns nil' do
          expect(app).to receive(:call).with(
            hash_including(SocrataSession::SOCRATA_SESSION_ENV_KEY => respond_to(:authenticate))
          ) do |env_passed_to_app|
            expect(env_passed_to_app[SocrataSession::SOCRATA_SESSION_ENV_KEY].authenticate(env_passed_to_app)).to be_nil
          end

          subject.call(env)
        end
      end
    end
  end

  def env_without_session
    {
      "REQUEST_METHOD"=>"GET",
      "REQUEST_URI"=>"http://domain.in.host.header.example.com/some_path?query=value",
      "SCRIPT_NAME"=>"/some_path",
      "SERVER_NAME"=>"domain.in.host.header.example.com",
      "SERVER_PORT"=>"80",
      "HTTP_HOST"=>"domain.in.host.header.example.com",
      "REQUEST_PATH"=>"/stories/admin",
    }
  end

  def env_with_session
    env_without_session.merge(
      'rack.request.cookie_hash' => {
        '_core_session_id' => 'core321'
      }
    )
  end

  def env_with_csrf_token
    env_without_session.merge(
      'rack.request.cookie_hash' => {
        '_core_session_id' => 'core321',
        'socrata-csrf-token' => 'rOCiUjEHDsMTx7+nPv05tOI6MVOXW4ZtlXlqJI7+Zuo='
      }
    )
  end
end
