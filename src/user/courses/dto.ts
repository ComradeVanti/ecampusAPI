import { SemesterScrapeData } from '../../scrapers/semester';

export type ReqDto = {
  session: string;
};

export type SuccessResDto = SemesterScrapeData[];
