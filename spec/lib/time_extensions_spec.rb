require 'time_extensions'
require 'rails_helper'

describe Time do

  it 'should quantize to the nearest future time window' do
    allow(Time).to receive(:now).and_return(Time.at(1477944181))
    expect(Time.now.quantize_to(5)).to eq(Time.at(1477944185))
  end

  it 'should quantize to the nearest past time window with negative numbers' do
    allow(Time).to receive(:now).and_return(Time.at(1477944181))
    expect(Time.now.quantize_to(-5)).to eq(Time.at(1477944180))
  end

end
