/**
 * Creates necessary information for fileDownloader middleware.
 * Please embed the data returned from this function in your action
 * creator along with your original custom data.
 *
 * If the file download action canceled previously fileDownloader will
 * just remove the cancellation instead of making a new request.
 *
 * Example:
 *
 * ```js
 * function myActionCreator(someInfo) {
 *   return {
 *     type: MY_CUSTOM_DOWNLOAD_FILE,
 *     someInfo,
 *     ...createGenericDownload('sample.csv', 'https://....', MY_CUSTOM_SUCCESS, MY_CUSTOM_FAILURE)
 *   };
 * }
 * ```
 *
 * @param {String} fileName File name for fallback method for the downloaded file
 * @param {String} fileUrl File url to download
 * @param {String} successType Action type which will be fired when download finished
 * @param {String} failureType Action type which will be fired when download failed
 * @returns Object
 */
export function createGenericDownload(fileName, fileUrl, successType, failureType) {
  return {
    'genericDownload.create': {
      fileName,
      fileUrl,
      successActionType: successType,
      failureActionType: failureType
    }
  };
}

/**
 * Create necessary information for fileDownloader middleware to cancel a download.
 * Please embed the data returned from this function in your action creator alongside
 * with your custom action data.
 *
 * Unfortunately there is no support for aborting a fetch request right now. fileDownloader
 * will only prevent file to be saved on disk. But downloading (request) will continue.
 *
 * Example:
 *
 * ```js
 * function myActionCreator(someInfo) {
 *   return {
 *     type: MY_CUSTOM_CANCEL_DOWNLOAD,
 *     someInfo,
 *     ...cancelGenericDownload('https://....')
 *   };
 * }
 *
 * @param fileUrl
 * @returns Object
 */
export function cancelGenericDownload(fileUrl) {
  return {
    'genericDownload.cancel': {
      fileUrl
    }
  };
}
