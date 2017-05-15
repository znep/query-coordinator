import { CHANNEL_JOIN_STARTED } from '../actions/channels';

export default function channels(state = {}, action) {
  switch (action.type) {
    case CHANNEL_JOIN_STARTED:
      return {
        ...state,
        [action.channelName]: action.channel
      };

    default:
      return state;
  }
}
