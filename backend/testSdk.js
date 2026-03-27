const { getAIAdvisory } = require('./services/aiService.js');
getAIAdvisory('hello there', {})
  .then(r => console.log('SDK SUCCESS:', r.substring(0, 300)))
  .catch(console.error);
