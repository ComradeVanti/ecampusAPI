export type LoginReqDto = {
  username: string;
  password: string;
};

export type LoginSuccessResDto = {
  session: string
}
