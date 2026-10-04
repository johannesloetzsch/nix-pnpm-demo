export type Heading = {
  slug: string;
  title: string;
  level: number;
};

export type Page = {
  slug: string;
  title: string;
  html: string;
  headings: Heading[];
};
