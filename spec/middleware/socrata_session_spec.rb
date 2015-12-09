require 'socrata_session'

describe SocrataSession do

  let(:app) { double(:app) }
  let(:env) { Hash.new }
  let(:mock_current_user) do
    { id: 'four-four' }
  end

  subject { SocrataSession.new(app) }

  it 'calls app with the same env hash' do
    expect(app).to receive(:call).with(env)
    subject.call(env)
  end

  it 'sets session store from headers from request' do
    allow(app).to receive(:call)
    mock_headers = { 'Haha' => 'You are a clown' }
    expect(CoreServer).to receive(:headers_from_request).and_return(mock_headers)
    subject.call(env)
    expect(::RequestStore.store[:socrata_session_headers]).to eq(mock_headers)
  end

  describe '#authenticate' do

    context 'without any core session present in the cookies' do
      let(:env) { env_without_session }

      it 'returns nil' do
        expect(CoreServer).to_not receive(:current_user)
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

      it 'returns the current user hash' do
        expect(CoreServer).to receive(:current_user).and_return(mock_current_user)

        expect(app).to receive(:call).with(
          hash_including(SocrataSession::SOCRATA_SESSION_ENV_KEY => respond_to(:authenticate))
        ) do |env_passed_to_app|
          expect(env_passed_to_app[SocrataSession::SOCRATA_SESSION_ENV_KEY].authenticate(env_passed_to_app)).to include(mock_current_user)
        end

        subject.call(env)
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
      'HTTP_COOKIE' => '_core_session_id=core321'
    )
  end
end
