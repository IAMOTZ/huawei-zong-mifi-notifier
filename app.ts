/* eslint-disable no-underscore-dangle */
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import xmljs from 'xml-js';
import VoiceNotifier from './notifiers/VoiceNotifier';

type dataSource = {
  batteryLevel: {
    url: string,
    axiosConfig: AxiosRequestConfig,
  },
  notifications: {
    url: string,
    axiosConfig: AxiosRequestConfig,
  },
  cookie: {
    url: string,
    axiosConfig: AxiosRequestConfig,
  }
}

type dataOutput = {
  batteryLevel: number,
  unreadNotifications: number,
}

type fetchDataResponse = {
  batteryData: string,
  notificationsData: string,
}

class Poll {
  constructor(public dataSource: dataSource, public battThreashold: number) {};

  compareData(oldData: dataOutput, newData: dataOutput): boolean {
    if (newData.batteryLevel < this.battThreashold) return true;
    if (oldData.unreadNotifications < newData.unreadNotifications) return true;
    return false;
  }

  exitMonitoring(reason: string, code: number = 0): void {
    console.log('==========Exiting monitoring process=======');
    console.log('Reason: ', reason);
    // @todo: how can I send notification about this so I know when the monitoring exits
    process.exit(code);
  }

  async getCookie(): Promise<string | null> {
    const response: any = await axios({
      method: 'get',
      url: this.dataSource.cookie.url,
      ...this.dataSource.batteryLevel.axiosConfig
    });
    const cookieString: string = response.headers["set-cookie"] ? response.headers["set-cookie"][0] : '';
    const cookieMatch = cookieString.match(/^.*?(SessionID.*?);.*$/)
    return cookieMatch ? (<RegExpMatchArray>cookieMatch)[1] : null;
  }

  async fetchData(): Promise<fetchDataResponse> {
    // @todo: I don't need to generate token every time, I can reuse token that I generate for some time
    const cookie: string | null = await this.getCookie();
    if (!cookie) this.exitMonitoring('Unable to get cookie from server');
    const [batteryResponse, notificationsRespnose] = await Promise.all([
      axios({
        method: 'get',
        url: this.dataSource.batteryLevel.url,
        ...this.dataSource.batteryLevel.axiosConfig,
        headers: {
          Cookie: cookie,
        }
      }),
      axios({
        method: 'get',
        url: this.dataSource.notifications.url,
        ...this.dataSource.notifications.axiosConfig,
      })
    ]);
    return {
      batteryData: batteryResponse.data,
      notificationsData: notificationsRespnose.data
    }
  }

  formatData(data: fetchDataResponse): dataOutput {
    const battery = <any>xmljs.xml2js(data.batteryData, { compact: true });
    const notifications = <any>xmljs.xml2js(data.notificationsData, { compact: true });
    console.log('notifications: ', notifications, 'battery: ', battery);
    if (!battery.response || !notifications.response) {
      this.exitMonitoring('Server data does not include actual response, most likely an error occured');
    }
    return {
      batteryLevel: battery.response.BatteryPercent._text,
      unreadNotifications: notifications.response.UnreadMessage._text
    }
  }

  async monitor(interval: number, cb: (data: dataOutput) => void) {
    let oldData: dataOutput = {
      batteryLevel: 0,
      unreadNotifications: 0
    };
    let data: fetchDataResponse = await this.fetchData();
    let newData: dataOutput = this.formatData(data);
    if (this.compareData(oldData, newData)) {
      cb(newData);
      oldData = newData;
    }
    setInterval(async () => {
      let data = await this.fetchData();
      let newData: dataOutput = this.formatData(data);
      if (this.compareData(oldData, newData)) {
        cb(newData);
        oldData = newData;
      }
    }, interval);
  }
}



// ================= APP ========
const wifiDataSource: dataSource = {
  batteryLevel: {
    url: 'http://192.168.8.1/api/monitoring/status',
    axiosConfig: { }
  },
  notifications: {
    url: 'http://192.168.8.1/api/monitoring/check-notifications',
    axiosConfig: {}
  },
  cookie: {
    url: 'http://192.168.8.1/html/home.html',
    axiosConfig: {}
  }
}

const voiceNotifier = new VoiceNotifier();
const poll = new Poll(wifiDataSource, 20);

const fifteenMS = 15 * 60 * 1000;
poll.monitor(fifteenMS, (data) => {
  console.log('Data from cb: ', data);
  voiceNotifier.send(data);
});
