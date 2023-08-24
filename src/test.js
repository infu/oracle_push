import { version, binance, kraken, coinbase, kucoin } from "ccxt";
import icblast, { fileIdentity, toState } from "@infu/icblast";
let identity = fileIdentity(1);

let ic = icblast({ identity }); // you can also add local_host: "http://192.168.0.100:8000"

let aggregator = await ic("u45jl-liaaa-aaaam-abppa-cai");
console.log("Your identity: " + identity.getPrincipal().toText());

const binanceApi = new binance();
const krakenApi = new kraken();
const kucoinApi = new kucoin();

async function ICP_extra() {
  let r = await fetch(
    "https://api.coincap.io/v2/assets/internet-computer"
  ).then((x) => x.json());
  let circulating = Number(r.data.supply);
  let volume = Number(r.data.volumeUsd24Hr);
  return { circulating, volume };
}

async function BTC_extra() {
  let r = await fetch("https://api.coincap.io/v2/assets/bitcoin").then((x) =>
    x.json()
  );
  let circulating = Number(r.data.supply);
  let total = Number(r.data.maxSupply);
  let volume = Number(r.data.volumeUsd24Hr);
  return { circulating, total, volume };
}

async function ETH_extra() {
  let r = await fetch("https://api.coincap.io/v2/assets/ethereum").then((x) =>
    x.json()
  );
  let circulating = Number(r.data.supply);
  let total = Number(r.data.supply);
  let volume = Number(r.data.volumeUsd24Hr);
  return { circulating, total, volume };
}

async function binancePrice() {
  let r = await binanceApi.fetchTickers([
    "BTC/USDT",
    "ICP/USDT",
    "ETH/USDT",
    "TUSD/USDT",
  ]);
  let toUsd = Number(r["TUSD/USDT"].info.lastPrice);
  return [
    ["BTC/USD", Number(r["BTC/USDT"].info.lastPrice) * toUsd],
    ["ICP/USD", Number(r["ICP/USDT"].info.lastPrice) * toUsd],
    ["ETH/USD", Number(r["ETH/USDT"].info.lastPrice) * toUsd],
  ];
}

async function krakenPrice() {
  let r = await krakenApi.fetchTickers([
    "BTC/USD",
    "ICP/USD",
    "ETH/USD",
    // "USDT/USD",
  ]);

  return [
    ["BTC/USD", Number(r["BTC/USD"].last)],
    ["ICP/USD", Number(r["ICP/USD"].last)],
    ["ETH/USD", Number(r["ETH/USD"].last)],
  ];
}

async function kucoinPrice() {
  let r = await kucoinApi.fetchTickers([
    "BTC/USDT",
    "ICP/USDT",
    "ETH/USDT",
    "USDT/TUSD",
  ]);

  let toUsd = 1 / Number(r["USDT/TUSD"].last);

  return [
    ["BTC/USD", Number(r["BTC/USDT"].last) * toUsd],
    ["ICP/USD", Number(r["ICP/USDT"].last) * toUsd],
    ["ETH/USD", Number(r["ETH/USDT"].last) * toUsd],
  ];
}

var ICP_EXTRA = await ICP_extra();
var BTC_EXTRA = await BTC_extra();
var ETH_EXTRA = await ETH_extra();

setInterval(async () => {
  ICP_EXTRA = await ICP_extra();
  BTC_EXTRA = await BTC_extra();
  ETH_EXTRA = await ETH_extra();
}, 1000 * 60 * 30);

setInterval(async () => {
  let data = await binancePrice().catch(async (e) =>
    kucoinPrice().catch(async (e) => krakenPrice())
  );
  console.log("pdata", data);
  data.push(["ICP-CS", ICP_EXTRA.circulating]);
  data.push(["ICP/USD-V24", ICP_EXTRA.volume]);

  data.push(["BTC-CS", BTC_EXTRA.circulating]);
  data.push(["BTC-TS", BTC_EXTRA.total]);
  data.push(["BTC/USD-V24", BTC_EXTRA.volume]);

  data.push(["ETH-CS", ETH_EXTRA.circulating]);
  data.push(["ETH-TS", ETH_EXTRA.total]);
  data.push(["ETH/USD-V24", ETH_EXTRA.volume]);

  try {
    console.log(data);
    await aggregator.oracle_push({ data }).then(console.log);
  } catch (e) {
    console.log(e.message);
  }
}, 5000);
