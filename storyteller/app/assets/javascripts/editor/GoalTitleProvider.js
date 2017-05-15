import StorytellerUtils from '../StorytellerUtils';
import httpRequest from '../services/httpRequest';
import Actions from './Actions';
import Constants from './Constants';
import { dispatcher } from './Dispatcher';

export const goalTitleProvider = StorytellerUtils.export(new GoalTitleProvider(), 'storyteller.goalTitleProvider');

/**
 * @class GoalTitleProvider
 * @description
 * This provider's sole responsibility is to contact Odysseus to
 * change a goal's title. It coordinates heavily with GoalTitleStore
 * to help our SettingsPanel render a reasonable representation of
 * goal title update progress and error state.
 *
 * Upon update completion, the story metadata is updated with
 * the new title—a goal's up-to-date title can be obtained from there.
 *
 * This Provider dispatches several actions to GoalTitleStore and StoryStore
 * to keep an up-to-date representation of goal title changes.
 */
export default function GoalTitleProvider() {

  /**
   * Changes the title of a Goal. This maps Storyteller's
   * idea of a title to the "name" attribute found in our Goals
   * API.
   *
   * @param goalId - In this system, it's the story's UID.
   * @param title - The replacement title.
   */
  this.changeTitle = (goalId, title) => {
    dispatcher.dispatch({
      action: Actions.GOAL_TITLE_SAVE_START
    });

    return httpRequest('GET', getApiUrl(goalId)).
      then((response) => {
        const goal = response.data;
        const options = {
          data: { name: title },
          headers: {
            'Content-Type': 'application/json',
            'If-Match': goal.version
          }
        };

        return httpRequest('PUT', getApiUrl(goalId), options);
      }).
      then(() => {
        dispatcher.dispatch({
          action: Actions.GOAL_TITLE_SAVE_FINISH,
          storyUid: goalId,
          title
        });

        return title;
      }).
      catch(errored);
  };

  function getApiUrl(goalId) {
    return `${Constants.GOALS_API_V1_PREFIX_PATH}/goals/${goalId}.json`;
  }

  function errored(error) {
    dispatcher.dispatch({
      action: Actions.GOAL_TITLE_SAVE_ERROR
    });

    return Promise.reject(error);
  }
}
