export type LoginReqDto = {
  username: string;
  password: string;
};

export type LoginAttemptDto = {
  username: string;
  password: string;
  loginToken: string
}

export type LoginSuccessResDto = {
  session: string
}
