import NodeMpv from "node-mpv";

export class MPV {
  mpv = new NodeMpv();
  constructor() {}

  // Load a YouTube URL
  async loadYouTubeUrl(url: string) {
    try {
      await this.mpv.start(); // Start this.mpv

      // Load the YouTube URL
      await this.mpv.load(url, "replace", ["--ytdl"]);
      console.log("YouTube video loaded successfully!");
    } catch (error) {
      console.error("Failed to load YouTube video:", error);
    }
  }

  // Get the current YouTube URL
  async getCurrentYouTubeUrl() {
    try {
      const url = await this.mpv.getFilename("full");
      return url || "";
    } catch (error) {
      console.error("Failed to get current YouTube URL:", error);
      return "";
    }
  }

  // Get the current timestamp
  async getCurrentTimestamp() {
    try {
      const timePosition = await this.mpv.getTimePosition();
      return timePosition || 0;
    } catch (error) {
      console.error("Failed to get current timestamp:", error);
      return 0;
    }
  }

  // Pause playback
  async pause() {
    try {
      await this.mpv.pause();
      console.log("Playback paused.");
    } catch (error) {
      console.error("Failed to pause playback:", error);
    }
  }

  // Resume playback
  async play() {
    try {
      await this.mpv.resume();
      console.log("Playback resumed.");
    } catch (error) {
      console.error("Failed to resume playback:", error);
    }
  }
}
