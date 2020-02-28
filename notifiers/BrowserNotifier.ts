import { INotifier, dataOutput } from '../types';

export default class BrowserNotifier implements INotifier {
  constructor() { }
  send(payload: dataOutput) {
    console.log('I am supposed to send this message to the browser but I can\'t for now');
    console.log('The payload');
  }
}