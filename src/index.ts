import express from 'express';
import 'dotenv/config';
import loginRouter from './login/routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(express.json());

app.use('/login', loginRouter);

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
