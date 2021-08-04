// @see: <https://www.w3.org/TR/motion-sensors/#high-pass-filters>

export class HighPassFilter {
  private _timestamp = Date.now();

  constructor(
    private _last: number[] = [0, 0, 0],
    private _cutoff: number = 0.8,
  ) {}

  filter(rawData: number[]) {
    const now = Date.now();
    const dt = (now - this._timestamp) / 1000;
    const alpha = this._cutoff / (this._cutoff + dt);

    this._timestamp = now;

    this._last = this._last.map((lastData, idx) => {
      return lastData + alpha * (rawData[idx] - lastData);
    });

    return this._last;
  }
}

export class LowPassFilter {
  constructor(
    private _last: number[] = [0, 0, 0],
    private _bias: number = 0.8,
  ) {}

  filter(rawData: number[]) {
    this._last = this._last.map((lastData, idx) => {
      return lastData * this._bias + rawData[idx] * (1 - this._bias);
    });

    return this._last;
  }
}