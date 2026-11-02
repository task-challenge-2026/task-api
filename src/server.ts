import { createApp } from './app';

const port = Number(process.env.PORT) || 4000;

createApp().listen(port, () => {
  console.log(`Task API listening on port ${port}`);
});
