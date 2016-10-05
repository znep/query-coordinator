module GoalStubs
  def stub_goal_accessibility(uid, accessible)
    goal_double = double('Goal')
    allow(goal_double).to receive(:accessible?).and_return(accessible)
    allow(OpenPerformance::Goal).to(
      receive(:new).
      with(uid).
      and_return(goal_double)
    )
  end
end

RSpec.configure do |config|
  config.include GoalStubs
end
