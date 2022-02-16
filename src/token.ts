#!/usr/bin/env node
// Takes a user inputted fediverse instance and generates a token for the bot, and adds it to the configuration file
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import generator, { detector, OAuth } from "megalodon";
import { exit } from "process";
import { question } from "readline-sync";
import * as fs from "fs";

const optionDefinitions = [
    {
        name: "help",
        type: Boolean,
        alias: "h",
        description: "Print this usage guide."
    },
    {
        name: "verbose",
        type: Boolean,
        alias: "v",
        description: "Print debugging output."
    }
];
const args = commandLineArgs(optionDefinitions);
if (args.help) {
    const usage = commandLineUsage([
        {
            header: "Token Grabber",
            content: "Grabs tokens for the bot to use."
        },
        {
            header: "Options",
            optionList: optionDefinitions
        },
        {
            content: "Project home: {underline https://git.froth.zone/Sam/fediverse-imagebot}"
        }
    ]);
    console.log(usage);
    exit(0);
}

if (args.verbose) {
    console.log("Running in verbose mode.");
    console.log();
}

const instance: string = question("Instance URL: ");
callDetector(instance).then(type => {
    const client = generator(type, instance);
    client.registerApp("Node Imagebot", { website: "https://git.froth.zone/Sam/fediverse-imagebot" })
        .then((appData) => {
            const clientId = appData.clientId;
            const clientSecret = appData.clientSecret;
            console.log("Please open this URL in your browser for the authorization code.");
            console.log(appData.url);
            let code: string;
            if (type === "misskey") {
                code = appData.session_token || "";
                question("Authenticate with Misskey, then hit return.");
            } else {
                code = question("Authorization Code: ");
            }
            client.fetchAccessToken(clientId, clientSecret, code)
                .then((tokenData: OAuth.TokenData) => {
                    if (args.verbose) {
                        console.log(`Access Token: ${tokenData.accessToken}`);
                        console.log(`Refresh Token: ${tokenData.refreshToken}`);
                    }
                    const config = {
                        instance: instance,
                        type: type,
                        accessToken: tokenData.accessToken,
                        refreshToken: tokenData.refreshToken
                    };
                    fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
                    console.log("Saved config to ./config.json");
                    exit(0);
                })
                .catch((err: Error) => { // catch for fetchAccessToken
                    console.error("Access Token fetch failed.");
                    console.error("Run with -v to see the full error.");
                    if (args.verbose)
                        console.error(err);
                    exit(1);
                });
        })
        .catch((err: Error) => { // catch for registerApp
            console.error("App registration failure!");
            console.error("Run with -v to see the full error.");
            if (args.verbose)
                console.error(err);
            exit(1);
        });
});

async function callDetector(instance: string) {
    const type = await detector(instance).catch((err) => {
        console.error("This does not seem to be a valid instance!");
        console.error("Supported instance types: Mastodon, Misskey, Pleroma");
        console.error("Run with -v to see the full error.");
        if (args.verbose)
            console.error(err);
        exit(1);
    });
    if (args.verbose)
        console.log(`Detected ${instance} as a ${type} instance.`);
    return type;
}