module.exports = {
    elasticsearch: {
      url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' // Use environment variable if available
    }
  };
  