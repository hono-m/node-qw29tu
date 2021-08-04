type Curve = {
  color: string,
  data: number[],
};

type GraphConfig = {
  width: number,
  height: number,
  dataSize: number,
};

export class Graph {
  readonly canvas = document.createElement('canvas');

  private _width: number;
  private _height: number;
  private _dataSize: number;

  private _curve: {
    [curveName: string]: Curve,
  } = {};

  private _filter = new Set<string>();

  private _ctx = this.canvas.getContext('2d');
  private _DPR = window.devicePixelRatio || 1;

  private _renderID: number;

  constructor({
    width = 500,
    height = 500,
    dataSize = 200,
  }: Partial<GraphConfig> = {}) {
    this._dataSize = dataSize;

    this.resize(width, height);
  }

  resize(width: number, height: number) {
    const {
      canvas,
      _DPR,
    } = this;

    this._width = width;
    this._height = height;

    canvas.width = width * _DPR;
    canvas.height = height * _DPR;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  appendTo(elem: HTMLElement) {
    elem.appendChild(this.canvas);
  }

  addCurve(curveName: string, color: string) {
    const curve = this._curve[curveName] || {} as Curve;

    curve.color = color;
    curve.data = curve.data || [];

    this._curve[curveName] = curve;

    this._filter.add(curveName);
  }

  addData(curveName: string, data: number) {
    const curve = this._curve[curveName];

    if (!curve) {
      throw new Error(`unknown curve ${curveName}`);
    }

    curve.data.push(data);

    if (curve.data.length > this._dataSize) {
      curve.data.shift();
    }
  }

  filterCurve(curves: string[]) {
    this._filter = new Set(curves);
  }

  clear() {
    this._ctx.clearRect(0, 0, this._width * this._DPR, this._height * this._DPR);
  }

  render() {
    this.clear();

    // x = 0
    this._draw((ctx) => {
      ctx.fillStyle = '#ccc';
      ctx.fillRect(0, 0, this._width, 1);
    });

    this._plot();

    this._renderID = requestAnimationFrame(this.render.bind(this));
  }

  stop() {
    cancelAnimationFrame(this._renderID);
  }

  destroy() {
    this.stop();
    this.canvas.remove();
  }

  private _draw(fn: (ctx: CanvasRenderingContext2D) => void) {
    const {
      _ctx,
      _DPR,
    } = this;

    _ctx.save();
    _ctx.scale(_DPR, _DPR);
    _ctx.transform(1, 0, 0, -1, 0, this._height / 2);

    fn(_ctx);

    _ctx.restore();
  }

  private _plot() {
    const unitX = this._width / this._dataSize;
    const unitY = this._height / 10;

    Object.keys(this._curve).forEach((curveName, idx) => {
      if (!this._filter.has(curveName)) {
        return;
      }

      const {
        color,
        data,
      } = this._curve[curveName];

      this._draw((ctx) => {
        ctx.strokeStyle = ctx.fillStyle = color;

        ctx.beginPath();
        ctx.moveTo(0, 0);

        const max = data.length;
        // plot
        for (let i = 0; i < max; i++) {
          ctx.lineTo(i * unitX, data[i] * unitY);
        }

        ctx.stroke();

        // annotate
        const offsetX = 10;
        const offsetY = 20 * (idx + 1);
        const lineLength = 20;

        ctx.lineWidth = 2;
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // reset to screen coord
        ctx.setTransform(this._DPR, 0, 0, this._DPR, 0, 0);

        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        ctx.lineTo(offsetX + lineLength, offsetY);

        ctx.stroke();
        ctx.fillText(curveName, offsetX + lineLength + 5, offsetY);
      });
    });
  }
}