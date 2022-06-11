// Takes a user inputted fediverse instance and generates a token for the bot, and adds it to the configuration file
import generator, { detector, OAuth } from "megalodon";
import { exit } from "process";
import { question } from "readline-sync";
import * as fs from "fs";

import args from "./args.js";

const instance = `https://${question("Instance URL: https://")}`;
callDetector(instance)
  .then((type) => {
    const client = generator(type, instance);
    console.log(
      "What would you like the app name to be? (default: JS-FediToken)"
    );
    const appName = question("App Name: ") || "JS-FediToken";
    console.log(
      "What would you like the app's website to be? (default: https://git.froth.zone/Sam/js-feditoken)"
    );
    const appWebsite =
      question("App Website: ") || "https://git.froth.zone/Sam/js-feditoken";
    client
      .registerApp(appName, { website: appWebsite })
      .then((appData) => {
        const clientId = appData.clientId;
        const clientSecret = appData.clientSecret;
        console.log(
          "Please open this URL in your browser for the authorization code."
        );
        console.log(appData.url);
        let code: string;
        if (type === "misskey") {
          code = appData.session_token || "";
          question("Authenticate with Misskey, then hit return.");
        } else {
          code = question("Authorization Code: ");
        }
        client
          .fetchAccessToken(clientId, clientSecret, code)
          .then((tokenData: OAuth.TokenData) => {
            if (args.verbose) {
              console.log(`Access Token: ${tokenData.accessToken}`);
              console.log(`Refresh Token: ${tokenData.refreshToken}`);
            }
            const config = {
              instance: instance,
              type: type,
              accessToken: tokenData.accessToken,
              refreshToken: tokenData.refreshToken,
            };
            fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
            console.log("Saved config to ./config.json");
            exit(0);
          })
          .catch((err: Error) => {
            // catch for fetchAccessToken
            console.error("Access Token fetch failed.");
            if (args.verbose) console.error(err);
            else console.error("Run with -v to see the full error.");
            exit(1);
          });
      })
      .catch((err: Error) => {
        // catch for registerApp
        console.error("App registration failure!");
        if (args.verbose) console.error(err);
        else console.error("Run with -v to see the full error.");
        exit(1);
      });
  })
  .catch((err: Error) => {
    // catch for callDetector
    console.error("Instance detection failed!");
    if (args.verbose) console.error(err);
    else console.error("Run with -v to see the full error.");
    exit(1);
  });

async function callDetector(instance: string) {
  const type = await detector(instance).catch((err) => {
    console.error("This does not seem to be a valid instance!");
    console.error("Supported instance types: Mastodon, Misskey, Pleroma");
    if (args.verbose) console.error(err);
    else console.error("Run with -v to see the full error.");
    exit(1);
  });
  if (args.verbose) console.log(`Detected ${instance} as a ${type} instance.`);
  return type;
}
