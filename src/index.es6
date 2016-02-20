import { ReefClient, SqsBrokerFacade } from 'reef-client';
import async from 'async';
import clui from 'clui';
import clear from 'clear';
import dotenv from 'dotenv';

dotenv.load();

function dispatchOneTransaction(client, sleep, next) {

  client.query('echo-data', {
    sleep: echoSleep,
    data: "hello reefter"
  }).then((data) => {
    resCount++;
  }).catch((err) => {
    errorCount++;
  });

  setTimeout(() => {
    next();
  }, sleep);

}

async function start() {

  clear(true);

  let Gauge = clui.Gauge;

  let brokerFacade = new SqsBrokerFacade({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    serviceDomain: 'service-mock',
    serviceLane: 'shared',
    clientDomain: 'stress-tester',
    clientLane: 'instance001'
  });

  let client = new ReefClient(brokerFacade);

  try {
    console.log('setting up client');
    await client.setup();
    console.log('starting up client');
    await client.start();
  }
  catch (err) {
    console.error(err);
  }

  clear(true);

  async.forever((next) => {

    clear(false);

    let elapsed = (Date.now() - startedOn)/1000;
    let reqPs = Math.round(reqCount / elapsed);
    let resPs = Math.round(resCount / elapsed);

    console.log(`running ${reqCount}/${max} transactions at ${tps} tps`)
    console.log(Gauge(reqCount, max, 30, max, `${reqCount} reqs`));
    console.log(Gauge(resCount, max, 30, max, `${resCount} ress`));

    console.log('io speed');
    console.log(Gauge(reqPs, 120, 30, 120, `${reqPs} req/s`));
    console.log(Gauge(resPs, 120, 30, 120, `${resPs} res/s`));
    console.log(Gauge(errorCount, max, 30, 0, `${errorCount} errors`));

    next();

  });

  async.whilst(
      () => { return reqCount <= max; },
      (callback) => {

        try {

          dispatchOneTransaction(client, sleep, callback);
          reqCount++;

        } catch (err) {
          callback(err);
        }

      },
      (err) => {

        console.log('done running');
        console.log(err);

      }
  );

}


let startedOn = Date.now();
let reqCount = 0;
let resCount = 0;
let errorCount = 0;

let echoSleep = 10;
let max = 1500;
let tps = 100;
let sleep = 1000/tps;

try {
  start();
} catch (err) {
  console.error(err);
}
