import { exec } from "child_process";
import { AudioSection } from "./main";

export function audioExtract(
  start: number,
  stop: number,
  audioUrl: string,
  outputPath: string
): Promise<string | undefined> {
  const args = [
    "ffmpeg",
    "-reconnect",
    "1",
    "-reconnect_streamed",
    "1",
    "-reconnect_delay_max",
    "5",
    "-ss",
    start.toString(),
    "-to",
    stop.toString(),
    "-i",
    `\"${audioUrl}\"`,
    outputPath,
  ];

  console.log(args);

  return new Promise((resolve, reject) => {
    exec(args.join(" "), (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to extract audio: ${error.message}`);
        reject(error);
      } else if (stderr) {
        console.log(stderr);
        resolve(outputPath);
      } else {
        resolve(outputPath);
      }
    });
  });
}

export function splitAndConcat(
  sections: AudioSection[],
  audioPath: string
): Promise<string | undefined> {
  const ext = audioPath.split(".").pop();
  const outputPath = `./data/${new Date().getTime()}.${ext}`;

  const args = [
    "ffmpeg",
    "-i",
    audioPath,
    "-filter_complex",
    `"${
      sections
        .map((section, i) => {
          return `[0:a]atrim=${section.startTimeInExtractedAudio}:${section.endTimeInExtractedAudio}[a${i}]`;
        })
        .join(";") +
      ";" +
      sections
        .map((_, i) => {
          return `[a${i}]`;
        })
        .join("") +
      `concat=n=${sections.length}:v=0:a=1,atempo=1.5[aout]`
    }"`.trim(),
    "-map",
    `"[aout]"`,
    outputPath,
  ];

  console.log(args);

  return new Promise((resolve, reject) => {
    exec(args.join(" "), (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to extract audio: ${error.message}`);
        reject(error);
      } else if (stderr) {
        console.log(stderr);
        resolve(outputPath);
      } else {
        resolve(outputPath);
      }
    });
  });
}
