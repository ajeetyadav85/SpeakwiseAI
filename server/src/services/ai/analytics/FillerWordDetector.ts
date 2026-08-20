export interface FillerWordMatch {
  word: string;
  timestampStart: number;
  timestampEnd: number;
}

export class FillerWordDetector {
  private static fillerList = ['um', 'uh', 'like', 'you know', 'actually', 'so', 'basically', 'I mean', 'right'];

  public static detect(transcript: string): { matches: FillerWordMatch[]; count: number } {
    const words = transcript.split(/\s+/);
    const matches: FillerWordMatch[] = [];
    let currentTime = 0;

    words.forEach((word) => {
      const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
      const wordDuration = 0.4; // Estimated word duration in seconds

      if (this.fillerList.includes(cleaned)) {
        matches.push({
          word: cleaned,
          timestampStart: parseFloat(currentTime.toFixed(1)),
          timestampEnd: parseFloat((currentTime + wordDuration).toFixed(1)),
        });
      }
      currentTime += wordDuration + 0.1;
    });

    return {
      matches,
      count: matches.length,
    };
  }
}
