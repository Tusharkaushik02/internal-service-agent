const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

const ragClient = axios.create({
  baseURL: RAG_SERVICE_URL,
  timeout: 15000,
});

const sanitizeResults = (results) =>
  results
    .filter(
      (document) =>
        document &&
        typeof document === 'object' &&
        document.id &&
        document.title &&
        document.category
    )
    .map((document) => ({
      id: document.id,
      title: document.title,
      category: document.category,
      content: document.content || '',
    }));

/** Retrieve knowledge-base documents without interrupting the request workflow. */
const searchKnowledgeBase = async (query, topK = 3) => {
  try {
    const response = await ragClient.post('/api/rag/search', {
      query,
      top_k: topK,
    });

    return {
      available: true,
      results: sanitizeResults(Array.isArray(response.data?.results) ? response.data.results : []),
    };
  } catch (error) {
    const reason =
      error.code === 'ECONNABORTED'
        ? 'timeout'
        : error.code === 'ECONNREFUSED'
          ? 'unavailable'
          : 'error';
    console.warn(`RAG service ${reason}`);
    return { available: false, results: [] };
  }
};

module.exports = { searchKnowledgeBase };
