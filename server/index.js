const { createApp } = require('./app');
const port = process.env.PORT || 3000;
createApp().listen(port, () => console.log(`Bhilai Travel Hub on http://localhost:${port}`));
