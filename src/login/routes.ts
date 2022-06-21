import express from 'express';
import { LoginAttemptDto, LoginReqDto, LoginSuccessResDto } from './dto';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import FormData from 'form-data';
import setCookie from 'set-cookie-parser';

const router = express.Router();

async function getLoginPageHtml(): Promise<string> {
  const res = await axios.get('https://ecampus.fhstp.ac.at/login/index.php');
  return res.data;
}

async function getLoginPageDocument(): Promise<Document> {
  const html = await getLoginPageHtml();
  return new JSDOM(html).window.document;
}

async function getLoginToken(): Promise<string | null> {
  const doc = await getLoginPageDocument();
  const inputElement: HTMLInputElement | null = doc.querySelector(
    "input[name='logintoken']"
  );
  return inputElement?.value ?? null;
}

async function tryLoginWith(dto: LoginAttemptDto): Promise<LoginSuccessResDto> {
  const formData = new FormData();
  formData.append('username', dto.username);
  formData.append('password', dto.password);
  formData.append('logintoken', dto.loginToken);
  const res = await axios.post(
    'https://ecampus.fhstp.ac.at/login/index.php',
    formData
  );
  const rawCookies = res.headers['set-cookie'] ?? [];
  const cookies = setCookie.parse(rawCookies);
  return { session: cookies[0].value };
}

router.get('/', async (req, res) => {
  const reqDto: LoginReqDto = req.body;
  const token = await getLoginToken();

  if (token !== null) {
    try {
      const resDto = await tryLoginWith({
        username: reqDto.username,
        password: reqDto.password,
        loginToken: token,
      });
      res.send(resDto);
    } catch (e) {
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(500);
  }
});

export default router;
