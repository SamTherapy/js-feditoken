#!/usr/bin/env node

// Takes a user inputted fediverse instance and generates a token for the bot, and adds it to the configuration file
import generator, { detector } from "megalodon";

import readline from "node:readline";
import { writeFile } from "node:fs/promises";
import { exit, stdin, stdout } from "node:process";

import args from "./args.js";

const rl = readline.createInterface({ input: stdin, output: stdout });

async function main() {
  const instance = `https://${await question("Instance URL: https://")}`;

  const type = await detector(instance).catch((err) => {
    console.error("This does not seem to be a valid instance!");
    console.error("Supported instance types: Mastodon, Misskey, Pleroma");
    if (args.verbose) console.error(err);
    else console.error("Run with -v to see the full error.");
    exit(1);
  });
  if (args.verbose) {
    console.log(`Detected ${instance} as a ${type} instance.`);
  }

  const client = generator(type, instance);

  console.log(
    "What would you like the app name to be? (default: JS-FediToken)"
  );
  const appName = (await question("App Name: ")) || "JS-FediToken";

  console.log(
    "What would you like the app's website to be? (default: https://git.froth.zone/Sam/js-feditoken)"
  );
  const appWebsite =
    (await question("App Website: ")) ||
    "https://git.froth.zone/Sam/js-feditoken";

  const appData = await client
    .registerApp(appName, { website: appWebsite })
    .catch((err: Error) => {
      console.error("App registration failure!");
      if (args.verbose) console.error(err);
      else console.error("Run with -v to see the full error.");
      exit(1);
    });

  const clientId = appData.clientId;
  const clientSecret = appData.clientSecret;
  console.log(
    "Please open this URL in your browser for the authorization code."
  );
  console.log(appData.url);

  let code: string;
  if (type === "misskey") {
    code = appData.session_token || "";
    await question("Authenticate with Misskey, then hit return.");
  } else {
    code = await question("Authorization Code: ");
  }

  const tokenData = await client
    .fetchAccessToken(clientId, clientSecret, code)
    .catch((err: Error) => {
      console.error("Access Token fetch failed.");
      if (args.verbose) console.error(err);
      else console.error("Run with -v to see the full error.");
      exit(1);
    });

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
  await writeFile("./config.json", JSON.stringify(config, null, 2));

  console.log("Saved config to ./config.json");
  exit(0);
}

/**
 * A wrapper for querying from stdin
 * @param text The text to display to the user
 * @returns User input
 */
async function question(text: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(text, resolve);
  });
}

main();
