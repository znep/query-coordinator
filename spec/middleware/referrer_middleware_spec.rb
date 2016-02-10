require 'referrer_middleware'

RSpec.describe ReferrerMiddleware do
  let(:app) { double(:app).as_null_object }
  let(:subject) { ReferrerMiddleware.new(app) }
  let(:env) do
    {
      'HTTP_REFERER' => 'http://domain.in.host.header.com/some_path?query=value'
    }
  end

  it 'calls app with the same env hash' do
    expect(app).to receive(:call).with(env)
    subject.call(env)
  end

  it 'saves HTTP_REFERER in RequestStore' do
    subject.call(env)
    expect(::RequestStore.store[:http_referrer]).to eq(env['HTTP_REFERER'])
  end
end
