import { ChatCompletionRequestMessage } from "openai";
import {
  confirmContinue,
  getHumanTextInput,
  getHumanVoiceInput,
} from "./getHumanInput";
import { chat } from "./openai";
import { answerQsPrompt, createUserQuestionMessage } from "./prompt";
import { Word } from "./types";
import { bestMatchingSubstring } from "./search";
import { MPV } from "./mpv";
import { getAudioStream, getInfo } from "./ydl";
import { audioExtract, splitAndConcat } from "./ffmpeg";
import { audioTranscribe } from "./transcribe";
import * as fs from "fs";

const callGpt = async (prompt: ChatCompletionRequestMessage[]) => {
  const response = await chat(prompt, false, "gpt-3.5-turbo");
  const msg = response.data.choices[0].message?.content;
  return msg;
};

type AudioFlashcard = {
  questionText: string;
  answerText: string;
  answerAudioPath: string;
  chapter: string | null;
  start: number;
};

export type AudioSection = {
  startTimeInExtractedAudio: number;
  endTimeInExtractedAudio: number;
};

async function main() {
  let keepGoing = true;

  const videoUrl = await getHumanTextInput("Video URL: ");
  if (!videoUrl) return;

  const [audioUrl, audioFormat] = await getAudioStream(videoUrl, false);

  const videoInfo = await getInfo(videoUrl);

  const mpv = new MPV();
  await mpv.loadYouTubeUrl(videoUrl);
  await mpv.play();

  const saveFlashcard = async (data: Omit<AudioFlashcard, "chapter">) => {
    // write  to file
    const getChapter = (start: number) => {
      if (!videoInfo.chapters) return null;
      const chapter = videoInfo.chapters.find(
        (chapter) => chapter.start_time <= start && chapter.end_time >= start
      );
      return chapter ? chapter.title : null;
    };
    const finalSavedData = {
      ...data,
      chapter: getChapter(data.start),
    };
    const json = JSON.stringify(finalSavedData, null, 2);
    const path = `./data/${new Date().getTime()}.json`;
    fs.writeFileSync(path, json);
    console.log("Saved flashcard to", path);
  };

  while (keepGoing) {
    let question = await getHumanVoiceInput();
    while (!question.includes("?")) {
      console.log(`Input: "${question}"`);
      console.log("Didn't hear a question. Try again.");
      question = await getHumanVoiceInput();
    }
    const curTime = await mpv.getCurrentTimestamp();
    console.log("Question:", question);

    if (!(await confirmContinue())) {
      continue;
    }

    if (!question || !curTime) return;

    const startTime = Math.max(curTime - 60, 0);
    const endTime = curTime;

    console.log("GETTING AUDIO...");
    const audioPath = await audioExtract(
      startTime,
      endTime,
      audioUrl,
      `./data/audio-${new Date().getTime()}.${audioFormat}`
    );
    console.log("Audio path:", audioPath);

    console.log("TRANSCRIBING...");
    const transcribed = await audioTranscribe(audioPath);
    console.log("Transcribed:", transcribed);

    const all_words: Word[] = transcribed!.segments.flatMap(
      (segment) => segment.words
    );

    const get_words_in_range = (start: number, end: number) => {
      return all_words.filter((word) => word.start >= start && word.end <= end);
    };

    const text = get_words_in_range(0, endTime - startTime)
      .map((x) => x.text)
      .join(" ")
      .toLowerCase()
      .trim();

    const prompt: ChatCompletionRequestMessage[] = [
      ...answerQsPrompt,
      createUserQuestionMessage({ text, question }),
    ];
    const msg = await callGpt(prompt);
    if (!msg) {
      console.log("No parsed output from GPT response");
      break;
    }

    const parts = msg
      .replace(/:/g, "")
      .replace(/"/g, "")
      .split("[...]")
      .map((x) => x.trim().toLowerCase());

    function convertCharacterIdxToWordIdx(characterIdx: number) {
      let charIdx = 0;
      for (let i = 0; i < all_words.length; i++) {
        const word = all_words[i];
        for (let j = 0; j < word.text.length; j++) {
          if (charIdx === characterIdx) return i;
          charIdx += 1;
        }
      }

      console.log("ERROR: Failed to convert character idx to word idx");
      return -1;
    }

    const validatedParts: { startCharacterIdx: number; text: string }[] = [];
    let error = false;
    for (const part of parts) {
      // check it exists in the text
      const index = text.indexOf(part);
      if (index === -1) {
        const { bestMatch, bestScore, bestStartIdx } = bestMatchingSubstring(
          part,
          text
        );
        if (bestMatch && bestScore > 0.8) {
          console.log(
            `Found partial match ${bestScore} "${bestMatch}" in text`
          );
          validatedParts.push({
            startCharacterIdx: bestStartIdx,
            text: bestMatch,
          });
        } else {
          console.log(`Could not find "${part}" in text`);
          error = true;
        }
      } else {
        console.log(`Found "${part}" in text`);
        validatedParts.push({ startCharacterIdx: index, text: part });
      }
    }

    if (!error && validatedParts.length > 0) {
      console.log("Validated parts:", validatedParts);
      console.log("All words", JSON.stringify(all_words));
      const answerText = validatedParts.map((x) => x.text).join(" ");
      console.log("Answer:", answerText);

      if (!(await confirmContinue())) {
        continue;
      }

      const audioSections: AudioSection[] = validatedParts.map((part) => {
        const startWordIdx = convertCharacterIdxToWordIdx(
          part.startCharacterIdx
        );

        const startTimeInExtractedAudio = all_words[startWordIdx].start;
        const endTimeInExtractedAudio =
          all_words[startWordIdx + part.text.split(" ").length - 1].end;

        if (startTimeInExtractedAudio < 0 || endTimeInExtractedAudio < 0) {
          throw new Error("Negative time");
        }

        return {
          startTimeInExtractedAudio,
          endTimeInExtractedAudio,
        };
      });

      const answerAudioPath = await splitAndConcat(audioSections, audioPath);

      if (!answerAudioPath) {
        console.log("Error splitting and concatenating audio");
      } else {
        await saveFlashcard({
          questionText: question,
          answerText,
          answerAudioPath,
          start: startTime,
        });
      }
    }

    console.log("Looping...");
  }

  console.log("Done.");
}

main();
