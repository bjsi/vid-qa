import * as readline from "readline";
import { spawn } from "child_process";

export function getHumanTextInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function getHumanVoiceInput(whisperPrompt?: string): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn("/home/james/Projects/cpp/whisper.cpp/command", [
      "-m",
      "/home/james/Projects/cpp/whisper.cpp/models/ggml-tiny.en.bin",
      "-t",
      "8",
      ...(whisperPrompt ? ["-p", `"${whisperPrompt}"`] : []),
    ]);

    setTimeout(() => {
      console.log("Listening for voice input...");
    }, 500);

    // had to recompile whisper.cpp/command to print to stderr?
    // stdout doesn't work???
    child.stderr.on("data", (data) => {
      const str = data.toString();
      if (str.startsWith("process_general_transcription: Command")) {
        const withoutPrefix = str.substring(
          "process_general_transcription: Command '".length
        );
        const withoutSuffix = withoutPrefix.substring(
          0,
          withoutPrefix.indexOf(", (t =")
        );
        const cmd = withoutSuffix
          .replace(/^'/, "")
          .replace(/'$/, "")
          .replace(/\u001b\[1m/g, "")
          .replace(/\u001b\[0m/g, "")
          .trim();
        if (
          cmd.includes("[BLANK_AUDIO]") ||
          cmd.includes("[typing]") ||
          cmd.includes("(footsteps)") ||
          cmd.includes("[SOUND]") ||
          cmd.includes("[Music]")
        ) {
        } else {
          child.kill();
          resolve(cmd);
        }
      }
    });
  });
}

export async function confirmContinue(): Promise<boolean> {
  const answer = await getHumanTextInput("Do you want to continue? (y/n) ");
  return answer.toLowerCase() === "y";
}
