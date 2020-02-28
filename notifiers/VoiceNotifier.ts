import { spawn } from 'child_process';
import { dataOutput, INotifier } from '../types';

export default class VoiceNotifier implements INotifier {
  constructor() { }
  send(payload: dataOutput) {
    const message = `Your battery level is ${payload.batteryLevel}. And you have ${payload.unreadNotifications} unread messages`;
    spawn('say', [message])
  }
}