// AudioWorklet that turns microphone audio into 16 kHz mono 16-bit PCM.
// Browsers capture at 44.1/48 kHz; Whisper wants 16 kHz, so we average-downsample here.
// Why not MediaRecorder? Its WebM/Opus chunks are not independently decodable (only the first
// one carries the header), so raw PCM is the reliable way to stream audio to the speech service.
class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000; // `sampleRate` is a global inside AudioWorkletGlobalScope
    this.pos = 0;
    this.acc = 0;
    this.count = 0;
    this.out = new Int16Array(3200); // 200 ms of output per message
    this.outLen = 0;
    this.sumSq = 0;
    this.levelSamples = 0;
    this.port.onmessage = (event) => {
      if (event.data === 'flush') {
        this.flush();
        this.port.postMessage({ flushed: true });
      }
    };
  }

  flush() {
    if (this.outLen > 0) {
      const chunk = this.out.slice(0, this.outLen);
      this.port.postMessage({ pcm: chunk.buffer }, [chunk.buffer]);
      this.outLen = 0;
    }
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      const x = channel[i];
      this.sumSq += x * x;
      this.acc += x;
      this.count += 1;
      this.pos += 1;
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio;
        const s = Math.max(-1, Math.min(1, this.acc / this.count));
        this.out[this.outLen++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        this.acc = 0;
        this.count = 0;
        if (this.outLen === this.out.length) this.flush();
      }
    }

    this.levelSamples += channel.length;
    if (this.levelSamples >= 2048) {
      this.port.postMessage({ level: Math.sqrt(this.sumSq / this.levelSamples) });
      this.sumSq = 0;
      this.levelSamples = 0;
    }
    return true;
  }
}

registerProcessor('pcm-capture', PcmCaptureProcessor);
