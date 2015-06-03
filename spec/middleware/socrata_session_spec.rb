require 'socrata_session'

describe SocrataSession do
  let(:app) { double(:app) }
  let(:env) { Hash.new }

  subject { SocrataSession.new(app) }

  it 'calls app with the same env hash' do
    expect(app).to receive(:call).with(env)
    subject.call(env)
  end

  context 'without any core session present in the cookies' do
    let(:env) { env_without_session }

    it "sets 'socrata.current_user' to nil'" do
      expect(app).to receive(:call).with(
        hash_including('socrata.current_user' => nil)
      )

      subject.call(env)
    end
  end

  context 'with a core session present in the cookies' do
    let(:env) { env_with_session }
    let(:auth) { double('auth') }

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

      it "sets 'socrata.current_user' to the hash returned by Core::Auth" do
        expect(app).to receive(:call).with(
          hash_including('socrata.current_user' => mock_current_user)
        )

        subject.call(env)
      end
    end

    context 'which is not valid' do
      before do
        expect(auth).to receive(:logged_in?).and_return(false)
      end

      it "sets 'socrata.current_user' to nil" do
        expect(app).to receive(:call).with(
          hash_including('socrata.current_user' => nil)
        )
        subject.call(env)
      end
    end
  end

  def env_without_session
    {
      "REQUEST_METHOD"=>"GET",
      "REQUEST_URI"=>"http://domain.in.host.header.com/some_path?query=value",
      "SCRIPT_NAME"=>"/some_path",
      "SERVER_NAME"=>"domain.in.host.header.com",
      "SERVER_PORT"=>"80",
      "HTTP_HOST"=>"domain.in.host.header.com",
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
end
