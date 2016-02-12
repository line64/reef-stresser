import { ReefClient, SqsBrokerFacade } from 'reef-client';
import async from 'async';
import clui from 'clui';
import clear from 'clear';

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
    region: 'sa-east-1',
    accessKeyId: 'AKIAIZ4ONXIKT5EUBQDA',
    secretAccessKey: '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',
    serviceDomain: 'service-mock',
    serviceLane: 'shared',
    clientDomain: 'stress-tester',
    clientLane: 'instance001'
  });

  let client = new ReefClient(brokerFacade);

  console.log('setting up client');
  await client.setup();

  console.log('starting up client');
  await client.start();

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
  console.log(err);
}