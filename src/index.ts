import express from 'express';
import 'dotenv/config';
import loginRouter from './login/routes';
import userRouter from './user/routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(express.json());

app.use('/login', loginRouter);
app.use('/user', userRouter);

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
