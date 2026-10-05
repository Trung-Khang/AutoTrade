import apiClient from './api';

export const chatbotApi = {
  sendMessage: (message, sessionId = null) =>
    apiClient.post('/chatbot/chat', { message, sessionId }),
};

export default chatbotApi;
