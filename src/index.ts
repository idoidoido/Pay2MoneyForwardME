// Copyright (c) 2023-2025 Riki Singh Khorana. All rights reserved. MIT License.
// Modified by idoido 2026

import * as dotenv from "dotenv";
import { RakutenPayWatcher } from "./RakutenPayWatcher";
import { ANAPayWatcher } from "./ANAPayWatcher";
import { VpointPayWatcher } from "./VpointPayWatcher";
import { exportToMoneyForwardME, Payment } from "./exportToMoneyForwardME";
import { TestmailClient } from "./TestmailClient";

/**
 * 環境変数の読み込み & チェック。
 */

dotenv.config();

const {
  TESTMAIL_API_KEY,
  TESTMAIL_NAMESPACE,
  MONEY_FORWARD_EMAIL,
  MONEY_FORWARD_PW,
} = process.env;

if (!TESTMAIL_API_KEY) {
  console.log("TESTMAIL_API_KEY env variable missing");
  process.exit(1);
}

if (!TESTMAIL_NAMESPACE) {
  console.log("TESTMAIL_NAMESPACE env variable missing");
  process.exit(1);
}

if (!MONEY_FORWARD_EMAIL) {
  console.log("MONEY_FORWARD_EMAIL env variable missing");
  process.exit(1);
}

if (!MONEY_FORWARD_PW) {
  console.log("MONEY_FORWARD_PW env variable missing");
  process.exit(1);
}

/**
 * Splash screen
 */

process.stdout.write("\x1Bc");
console.log("\x1b[1m\x1b[38;5;172m%s\x1b[0m", "\n   Pay2MoneyForwardME 0.3.0\n");

/**
 * メールをウォッチ。
 * 取引内容を抽出し、マネーフォワード ME に書き出す。
 */

const rpTestmailClient = new TestmailClient(TESTMAIL_API_KEY, TESTMAIL_NAMESPACE, "rp");//楽天ペイメール
const apTestmailClient = new TestmailClient(TESTMAIL_API_KEY, TESTMAIL_NAMESPACE, "ap");//ANA Payメール
const vpTestmailClient = new TestmailClient(TESTMAIL_API_KEY, TESTMAIL_NAMESPACE, "vp");//VポイントPayメール
const mfTestmailClient = new TestmailClient(TESTMAIL_API_KEY, TESTMAIL_NAMESPACE, "mf");//MF認証メール
const now = new Date();

const watcher = new RakutenPayWatcher(rpTestmailClient);
const watcher2 = new ANAPayWatcher(apTestmailClient);
const watcher3 = new VpointPayWatcher(vpTestmailClient);

watcher.subscribe((transactions) => {
  const payments: Payment[] = [];
  transactions.forEach((transaction) => {
    const {
      date,
      merchant,
      pointsUsed,
      cashUsed,
    } = transaction;

    // TODO: Dynamically edit category

    if (pointsUsed > 0) {
      console.log(` ⏬ ${date} ${merchant} 楽天ポイント利用 ${pointsUsed}`);
      payments.push({
        largeCategory: "0",
        middleCategory: "0",
        date,
        amount: pointsUsed,
        source: "0",
        content: `${merchant} 楽天ポイント利用`,
      });
    }

    if (cashUsed != 0 ) {
	if(!merchant.match(/ANA Pay/)){
      console.log(` ⏬ ${date} ${merchant} 楽天キャッシュ利用 ${cashUsed}`);
      payments.push({
        largeCategory: "0",
        middleCategory: "0",
        date,
        amount: cashUsed,
        source: "0",
        content: `${merchant} 楽天キャッシュ利用`,
      });
	}else{
      console.log(` ⏬ ${date} ${merchant} ${cashUsed}`);
      payments.push({
        largeCategory: "0",
        middleCategory: "0",
        date,
        amount: cashUsed,
        source: "ANA Pay",
        content: `${merchant}`,
      });
	}
    }
  });

  if (payments.length > 0) {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0].replaceAll("-", "/");
    const timeString = now.toLocaleTimeString();
    exportToMoneyForwardME(MONEY_FORWARD_EMAIL, MONEY_FORWARD_PW, mfTestmailClient, payments)
      .catch((e) => {
        console.error(`\n ${dateString} ${timeString} ❌ マネーフォワードへの書き出しに失敗しました。`);
        console.error(e);
        console.log();
      });
  }
});


watcher2.subscribe((transactions) => {
  const payments: Payment[] = [];
  transactions.forEach((transaction) => {
    const {
      date,
      merchant,
      totalAmount,
    } = transaction;

    // TODO: Dynamically edit category


    if (totalAmount != 0 ) {
      console.log(` ⏬ ${date} ${merchant} ${totalAmount}`);
      payments.push({
        largeCategory: "0",
        middleCategory: "0",
        date,
        amount: totalAmount,
        source: "ANA Pay",
        content: `${merchant}`,
      });

    }
  });

  if (payments.length > 0) {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0].replaceAll("-", "/");
    const timeString = now.toLocaleTimeString();
    exportToMoneyForwardME(MONEY_FORWARD_EMAIL, MONEY_FORWARD_PW, mfTestmailClient, payments)
      .catch((e) => {
        console.error(`\n ${dateString} ${timeString} ❌ マネーフォワードへの書き出しに失敗しました。`);
        console.error(e);
        console.log();
      });
  }
});

watcher3.subscribe((transactions) => {
  const payments: Payment[] = [];
  transactions.forEach((transaction) => {
    const {
      date,
      merchant,
      totalAmount,
    } = transaction;

    // TODO: Dynamically edit category


    if (totalAmount != 0 ) {
      console.log(` ⏬ ${date} ${merchant} ${totalAmount}`);
      payments.push({
        largeCategory: "0",
        middleCategory: "0",
        date,
        amount: totalAmount,
        source: "VポイントPay",
        content: `${merchant}`,
      });

    }
  });

  if (payments.length > 0) {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0].replaceAll("-", "/");
    const timeString = now.toLocaleTimeString();
    exportToMoneyForwardME(MONEY_FORWARD_EMAIL, MONEY_FORWARD_PW, mfTestmailClient, payments)
      .catch((e) => {
        console.error(`\n ${dateString} ${timeString} ?? マネーフォワードへの書き出しに失敗しました。`);
        console.error(e);
        console.log();
      });
  }
});
