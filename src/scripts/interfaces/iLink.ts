export interface ILink {
  id: string;
  linkId: string;
  title: string;
  type: string;
  unixTime: string;
  appName: string;
  appVersion: string;
  appIcon: string;
  category: string;
  description: string;
  from: string;
  fromUser: string;
  votes: string[];
}