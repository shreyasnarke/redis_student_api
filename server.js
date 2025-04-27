const express = require('express');
const axios = require('axios');
const redis = require('redis');
const app = express();
const PORT = 3000;
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));
(async () => {
  await redisClient.connect();
})();
app.get('/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log('Checking cache for student data...');
    const cachedStudent = await redisClient.get(`student:${studentId}`);
    if (cachedStudent) {
      console.log('Serving from cache');
      return res.json(JSON.parse(cachedStudent));
    }
    console.log('Fetching from API');
    const response = await axios.get(`https://jsonplaceholder.typicode.com/users/${studentId}`);
    const studentData = response.data;
    await redisClient.setEx(`student:${studentId}`, 3600, JSON.stringify(studentData));
    res.json(studentData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching student data');
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});