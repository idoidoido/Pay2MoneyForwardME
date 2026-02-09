// Copyright (c) 2023-2025 Riki Singh Khorana. All rights reserved. MIT License.

import { parse } from "node-html-parser";
import type { TestmailClient } from "./TestmailClient";
import readline from 'readline'

/**
 * testmail.app に送られてくる「［JAL Pay］ご利用のお知らせ」と
 * 「［JAL Pay］チャージ完了のお知らせ」から取引内容を抽出し、
 * それらに対してアクションを起こす関数を管理・通知を飛ばすクラス。
 */
export class JALPayWatcher {

  /** testmail.app client */
  private testmailClient: TestmailClient;

  /** Date of last ping */
  private lastPing?: Date;

  /** List of subscribers to JAL Pay transactions */
  private subscribers: JALPaySubscriber[];

  /**
   * testmail.app に送られてくる「［JAL Pay］ご利用のお知らせ」と
   * 「［JAL Pay］チャージ完了のお知らせ」から取引内容を抽出し、
   * それらに対してアクションを起こす関数を管理・通知を飛ばすオブジェクトを生成。
   *
   * @param testmailClient testmail.app client オブジェクト
   * @param pingInterval メールサーバーへの ping 頻度。デフォルト１分
   */

  constructor(
    testmailClient: TestmailClient,
    pingInterval = 1 * 60 * 1000,
  ) {
    this.testmailClient = testmailClient;
    this.subscribers = [];
    const start = new Date();//スクリプト開始以降受信のメールを取得
    setInterval(() => this.ping(start), pingInterval);
  }

  subscribe(fn: JALPaySubscriber) {
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
      const transactions: JALPayTransaction[] = [];
      for (const { html, downloadUrl, text } of emails) {
        if (!html) {
		if (!text){
			continue;
		}else{

		var transaction = this.parseEmailBody(text);
		
		}
	}else{
	
		var transaction = this.parseEmailBody(html);

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
   * Given text from a JAL Pay email, parse out the transaction details.
   */
  private parseEmailBody(body: string): JALPayTransaction {
    const result: JALPayTransaction = {
      date: "",
      merchant: "",
      totalAmount: 0,
    };

  for(const line of body.split('\n')){
        if(line.startsWith("ご利用") || line.startsWith("チャージ金額")){
            const [key,value] = line.split("：")
            if(key == "ご利用日時"){
                result.date = value.split(" ")[0].replace(/年|月/g,"/").replace("日","")
            }else if(key == "ご利用金額"){
                result.totalAmount = parseInt(value.replace("円", "").replace(",",""))
                result.merchant = " [JAL Pay]"
	    }else if(key == "チャージ金額"){
		const now = new Date();
    		const dateString = now.toISOString().split("T")[0].replaceAll("-", "/");
		result.date = dateString
                result.totalAmount = -parseInt(value.replace("円", "").replace(",",""))//チャージは金額をマイナスに
		result.merchant = "JAL Pay"
	    }
	}
  }


    return result;
  }

  private isValidTransaction(transaction: JALPayTransaction): boolean {
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
export interface JALPayTransaction {
  /** ご利用日時： YYYY/MM/DD */
  date: string;

  /** ご利用店舗 */
  merchant: string;

  /** ご利用金額 */
  totalAmount: number;

};

/**
 * 新規のJAL Pay取引内容に対してアクションを実行する関数。
 */
export type JALPaySubscriber = (transactions: JALPayTransaction[]) => void;
