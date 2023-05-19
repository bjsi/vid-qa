import { spawn } from "child_process";
import { Transcript } from "./types";

export function audioTranscribe(path: string): Promise<Transcript | undefined> {
  const args = [path, "--model", "tiny.en", "--output_format", "json"];

  return new Promise((resolve, reject) => {
    const process = spawn("whisper_timestamped", args);

    let stdoutData = "";
    let stderrData = "";

    process.stdout.on("data", (data) => {
      stdoutData += data;
    });

    process.stderr.on("data", (data) => {
      stderrData += data;
    });

    process.on("error", (error) => {
      console.error(`Failed to transcribe audio: ${error.message}`);
      reject(error);
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(JSON.parse(stdoutData) as Transcript);
      } else {
        console.log(stderrData);
        reject(new Error(`Transcription process exited with code ${code}`));
      }
    });
  });
}
