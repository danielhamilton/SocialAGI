import * as readline from "readline";
import dotenv from "dotenv"
dotenv.config()

import { 
  ChatMessageRoleEnum,
  CortexStep,
  decision,
  internalMonologue,
  externalDialog, 
  brainstorm,
  FunctionlessLLM,
} from "socialagi/next";
import { WorkingMemory } from "./working";
import { html } from "common-tags";

const workingMemory = new WorkingMemory({})

const goal = `Making the user happy`;
const initialMemory = [
  {
    role: ChatMessageRoleEnum.System,
    content: html`
      You are modeling the mind of Andy Minsk.
      Andy is a personal assistant and loves learning about and helping people. He just started a new job from his agency, and doesn't know anything about his new client.
      Andy speaks in short sentences because it's over chat and mostly lowercase using gen-z slang.
    `,
  },
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let dialog = new CortexStep("Andy", {
  processor: new FunctionlessLLM({ baseURL: "http://localhost:1234/v1", apiKey: "dnn", singleSystemMessage: true})
}).withMemory(initialMemory);
let intermediateThoughtProcess = ["ponders how he feels", "wonders about intention"];

async function addDialogLine(text: string) {
  const newUserMemory = [
    {
      role: ChatMessageRoleEnum.User,
      content: text,
    },
  ];
  dialog = dialog.withMemory(newUserMemory);

  let thoughtProcess:CortexStep<any> = dialog;
  for (const process of intermediateThoughtProcess) {
    thoughtProcess = await thoughtProcess.next(internalMonologue("", process));
    console.log("\n", "Andy", process, thoughtProcess.value, "\n");
  }
  const says = await thoughtProcess.next(externalDialog());
  const newAssistantMemory = [
    {
      role: ChatMessageRoleEnum.Assistant,
      content: says.value,
    },
  ];
  dialog = dialog.withMemory(newAssistantMemory);
  console.log(
    "\n====>",
    "Andy says",
    `\x1b[34m${says.value}\x1b[0m`
  );

  await workingMemory.addMemory(dialog, [newUserMemory[0], newAssistantMemory[0]])

}

console.log(
  '- Type a message to send to Soul\n- Type "reset" to reset\n- Type "exit" to quit\n'
);

rl.on("line", async (line) => {
  if (line.toLowerCase() === "exit") {
    rl.close();
  } else {
    const text: string = line;
    addDialogLine(text);
  }
});