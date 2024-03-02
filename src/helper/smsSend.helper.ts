/* eslint-disable prettier/prettier */

import * as http from "http";
import axios from "axios";

export async function sendMsg91Function(data) {
  try {
    var dataToSend = {
      sendStatus: false,
      response: null,
      error: false,
    };

    /**
     * msg_api_key msg_sender_id msg_login_otp
     */
    const options = {
      method: "POST",
      hostname: "control.msg91.com",
      port: null,
      path: "/api/v5/flow/",
      headers: {
        authkey: process.env.MSG91_API_KEY,
        "content-type": "application/json",
      },
    };

    const result = await new Promise(async function (resolve, reject) {
      const req = http.request(options, async function (res) {
        const chunks = [];

        let check = res.on("data", function (chunk) {
          chunks.push(chunk);
        });

        await res.on("end", function () {
          let body = Buffer.concat(chunks);
          let resBody = body.toString();
          console.log(resBody);
          try {
            resBody = JSON.parse(resBody);
          } catch (error) {
            console.log("Error parsing JSON:", error);
          }

          body = Buffer.alloc(0);
          if (resBody["type"] === "success") {
            dataToSend = {
              sendStatus: true,
              response: resBody,
              error: false,
            };
            resolve(dataToSend);
          } else {
            dataToSend = {
              sendStatus: false,
              response: null,
              error: true,
            };
            resolve(dataToSend);
          }
        });
      });

      await req.write(JSON.stringify(data));
      await req.end();
    });

    return result;
  } catch (error) {
    console.log("Error in sendMsg91Function:", error);

    return {
      sendStatus: false,
      response: null,
      error: true,
    };
  }
}

/**send sms helper */
export async function sendMessage(msg, mobile) {
  const message = encodeURIComponent(msg);
  const mobileNo = mobile;
  const senderId = "ESYPAN";
  const authKey = "a67539ef7443137cb16e93e4efd9d3c";

  const url = `http://msg.smscluster.com/rest/services/sendSMS/sendGroupSms?AUTH_KEY=${authKey}&message=${message}&senderId=${senderId}&routeId=1&mobileNos=${mobileNo}&smsContentType=english&DLT_TE_ID=1307161519716505989`;

  try {
    const response = await axios.get(url);

    return true;
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    return false;
  }
}
