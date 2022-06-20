export const enum Season {
  WINTER = 'WS',
  SUMMER = 'SS',
}

export type Semester = {
  year: number;
  season: Season;
};

export type Course = {
  id: number;
  name: string;
};

export type Html = string
