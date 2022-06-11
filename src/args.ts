import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { exit } from "process";
const optionDefinitions = [
  {
    name: "help",
    type: Boolean,
    alias: "h",
    description: "Print this usage guide.",
  },
  {
    name: "verbose",
    type: Boolean,
    alias: "v",
    description: "Print debugging output.",
  },
];
const args = commandLineArgs(optionDefinitions);
if (args.help) {
  const usage = commandLineUsage([
    {
      header: "Fediverse Token Grabber",
      content:
        "Grabs Masotodon, Pleroma or Misskey tokens for your bots to use.",
    },
    {
      header: "Options",
      optionList: optionDefinitions,
    },
    {
      content:
        "Project home: {underline https://git.froth.zone/sam/js-feditoken}",
    },
  ]);
  console.log(usage);
  exit(0);
}

if (args.verbose) {
  console.log("Running in verbose mode.\n");
}

export default args;
