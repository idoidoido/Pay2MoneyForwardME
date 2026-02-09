// Copyright (c) 2023-2025 Riki Singh Khorana. All rights reserved. MIT License.
// Modified by idoido 2026

import { parse } from "node-html-parser";
import type { TestmailClient } from "./TestmailClient";
import readline from 'readline'

/**
 * testmail.app に送られてくる「【VポイントPay】ご利用のお知らせ」と
 * 「【VポイントPay】プリペイド残高加算のお知らせ」から取引内容を抽出し、
 * それらに対してアクションを起こす関数を管理・通知を飛ばすクラス。
 */
export class VpointPayWatcher {

  /** testmail.app client */
  private testmailClient: TestmailClient;

  /** Date of last ping */
  private lastPing?: Date;

  /** List of subscribers to Vpoint Pay transactions */
  private subscribers: VpointPaySubscriber[];

  /**
   * testmail.app に送られてくる「【VポイントPay】ご利用のお知らせ」と
   * 「【VポイントPay】プリペイド残高加算のお知らせ」から取引内容を抽出し、
   * それらに対してアクションを起こす関数を管理・通知を飛ばすオブジェクトを生成。
   *
   * @param testmailClient testmail.app client オブジェクト
   * @param pingInterval メールサーバーへの ping 頻度。デフォルト１分
   */

  constructor(
    testmailClient: TestmailClient,
    pingInterval = 2 * 60 * 1000,
  ) {
    this.testmailClient = testmailClient;
    this.subscribers = [];
    const start = new Date();//スクリプト開始以降受信のメールを取得
    start.setDate(start.getDate() - 2);
    setInterval(() => this.ping(start), pingInterval);
  }

  subscribe(fn: VpointPaySubscriber) {
    this.subscribers.push(fn);
  }

  /**
   * Pings the mail server.
   * Extracts the transaction information and notifies subscribers on new mail.
   */
  private async ping(start: Date) {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0].replaceAll("-", "/");
    const timeString = now.toLocaleTimeString();
      if(this.lastPing == undefined) this.lastPing = start;
    try {
      const emails = await this.testmailClient.get(this.lastPing);

readline.cursorTo(process.stdout, 0);
process.stdout.write(dateString+" "+timeString)

      if (emails === undefined){
		return;
	}else if(emails.length === 0) {
	        return;
      }

      this.lastPing = now;
      const transactions: VpointPayTransaction[] = [];
      for (const { html, downloadUrl, text, date } of emails) {
        if (!html) {
		if (!text){
			continue;
		}else{

		var transaction = this.parseEmailBody(text,date);
		
		}
	}else{
	
		var transaction = this.parseEmailBody(html,date);

	}

        if (
          this.isValidTransaction(transaction)
        ) {
          transactions.push(transaction);
        } else {
          console.log(` ❌ ${dateString} ${timeString} メール内容を正しく読み取れませんでした。${downloadUrl}`);
        }
      }

      this.subscribers.forEach((subscriber) => subscriber(transactions));
    } catch {
      console.log(` ❌ ${dateString} ${timeString} サーバーとの通信に失敗しました。`);
    }
  }

  /**
   * Given text from a Vpoint Pay email, parse out the transaction details.
   */
  private parseEmailBody(body: string, emaildate: string): VpointPayTransaction {
    const result: VpointPayTransaction = {
      date: "",
      merchant: "",
      totalAmount: 0,
    };

  for(const line of body.split('\n')){
        if(line.startsWith("◇利用") || line.startsWith("◇加算")){
            const [key,value] = line.split(":　")

  　       	const now = new Date(emaildate);
    		const dateString = now.toISOString().split("T")[0].replaceAll("-", "/");
		result.date = dateString

	　　if(key == "◇利用金額　"){
                result.totalAmount = parseInt(value.replace("円", "").replace(",",""))
            }else if(key == "◇利用先　"){
                result.merchant = value + " [VポイントPay]"
	    }else if(key == "◇加算額　"){
                result.totalAmount = -parseInt(value.replace("円", "").replace(",",""))//チャージは金額をマイナスに
		result.merchant = "VポイントPay"
	    }
	}
  }


    return result;
  }

  private isValidTransaction(transaction: VpointPayTransaction): boolean {

    const {
      date,
      merchant,
      totalAmount,
    } = transaction;

    return (
      date !== ""
      && merchant !== ""
      && totalAmount !== 0
    );
  }
}

/**
 * 読み取れる取引内容。
 */
export interface VpointPayTransaction {
  /** ご利用日時： YYYY/MM/DD */
  date: string;

  /** ご利用店舗 */
  merchant: string;

  /** ご利用金額 */
  totalAmount: number;

};

/**
 * 新規のVpoint Pay取引内容に対してアクションを実行する関数。
 */
export type VpointPaySubscriber = (transactions: VpointPayTransaction[]) => void;
