export type dataOutput = {
  batteryLevel: number,
  unreadNotifications: number,
}

export interface INotifier {
  send(data: object): void;
}