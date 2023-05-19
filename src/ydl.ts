import { exec } from "child_process";

export function downloadAudio(
  url: string,
  goodQuality: boolean
): Promise<string> {
  const quality = goodQuality ? "bestaudio" : "worstaudio";
  const command = `yt-dlp --no-check-certificate -x -f ${quality} -o '%(id)s.%(ext)s' ${url}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to download audio: ${error.message}`);
        reject(error);
      } else if (stderr) {
        console.error(`Error while downloading audio: ${stderr}`);
        reject(new Error(stderr));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export function getSubs(url: string): Promise<string | undefined> {
  const command = `yt-dlp --skip-download --write-auto-sub --sub-lang en ${url}`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to get subs: ${error.message}`);
        reject(error);
      } else if (stderr) {
        console.error(`Error while getting subs: ${stderr}`);
        reject(new Error(stderr));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

type Chapter = {
  start_time: number;
  end_time: number;
  title: string;
};

interface VideoInfo {
  chapters: Chapter[] | null;
  title: string;
  id: string;
}

export function getInfo(url: string): Promise<VideoInfo> {
  const args = ["yt-dlp", "--no-warnings", "--no-check-certificate", "-J", url];

  return new Promise((resolve, reject) => {
    exec(args.join(" "), (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to get video info: ${error.message}`);
        reject(error);
      } else if (stderr) {
        console.error(`Error while getting video info: ${stderr}`);
        reject(new Error(stderr));
      } else {
        try {
          const info = JSON.parse(stdout);
          resolve(info);
        } catch (parseError) {
          console.error(`Error parsing video info: ${parseError}`);
          reject(parseError);
        }
      }
    });
  });
}

export function getStreams(url: string, quality: string): Promise<string> {
  const command = `yt-dlp --no-check-certificate -f ${quality} --youtube-skip-dash-manifest -g ${url}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to get video streams: ${error.message}`);
        reject(error);
      } else if (stderr) {
        console.error(`Error while getting video streams: ${stderr}`);
        reject(new Error(stderr));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export async function getAudioStream(
  url: string,
  goodQuality?: boolean
): Promise<[string | null, string | null]> {
  const quality = goodQuality ? "bestaudio" : "worstaudio";

  return getStreams(url, quality)
    .then((stdout) => {
      const lines = stdout.split("\n");
      const audioUrl = lines[0];
      const formatMatch = audioUrl.match(/mime=audio%2F([a-z0-9]+)&/);

      if (formatMatch) {
        const format = formatMatch[1];
        return [audioUrl, format] as [string, string];
      } else {
        console.error("Failed to get audio stream.");
        return [null, null] as [null, null];
      }
    })
    .catch((error) => {
      console.error("Error while getting audio stream:", error);
      return [null, null] as [null, null];
    });
}
