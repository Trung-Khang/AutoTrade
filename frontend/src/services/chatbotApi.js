import apiClient from './api';

export const chatbotApi = {
  sendMessage: (message, sessionId = null, previousQuery = null, excludedListingIds = []) =>
    apiClient.post('/chatbot/chat', { message, sessionId, previousQuery, excludedListingIds }),
  compare: (listingIds, purpose = null) =>
    apiClient.post('/chatbot/compare', { listingIds, purpose }),
};

export default chatbotApi;
