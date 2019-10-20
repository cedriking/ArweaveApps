import "./materialize.min";
import {links} from "./links";

export class App {
  public static appName = 'arweaveapps';
  public static appVersion = '2.0.0';

  constructor() {
    links.init();
  }
}

export const app = new App();
