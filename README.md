# Huawei-zong-mifi-notifier

I needed a way to get notified when my MiFi battery is low or when I have new notifications so I built this. Yes, there are a lot of ways I could have maybe solved this problem without writing code, however, the secondary reasons I built this is because I wanted to play around the API of the MiFi and also use the typescript I've been learning to do some actual coding.

This is not a general solution, so even if you are using Huawei-zong-mifi and you want to play around this code, you might need to tweak the code a little bit. 

# Running

All I need to do is run `npm run start:dev` and it reports to me via a voice-over, the MiFi battery level and the number of unread notifications. It continuously polls the MiFi API every x seconds(where x is configured within the app) and if there is an update i.e If my battery is lower than a set `battThreashold` or I have new notifications, I get informed.