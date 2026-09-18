const axios = require('axios');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

const ragClient = axios.create({
  baseURL: RAG_SERVICE_URL,
  timeout: 5000,
});

/** Retrieve knowledge-base documents without interrupting the request workflow. */
const searchKnowledgeBase = async (query, topK = 3) => {
  try {
    const response = await ragClient.post('/api/rag/search', {
      query,
      top_k: topK,
    });

    return {
      available: true,
      results: Array.isArray(response.data?.results) ? response.data.results : [],
    };
  } catch (error) {
    // Keep implementation details server-side; requests and tickets still proceed.
    console.warn(`RAG service unavailable: ${error.message}`);
    return { available: false, results: [] };
  }
};

module.exports = { searchKnowledgeBase };
