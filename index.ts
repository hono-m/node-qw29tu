import { Graph } from "./grap_h";
import { LowPassFilter } from "./filter";
import { getEarthCoord } from "./rotation-matrix";

const output = document.createElement("pre");

const graph = new Graph({
  width: window.innerWidth,
  height: window.innerHeight
});

const lpf = new LowPassFilter();

graph.addCurve("x", "red");
graph.addCurve("y", "green");
graph.addCurve("z", "blue");

graph.appendTo(document.body);
document.body.appendChild(output);

graph.render();

let alpha = 0;
let beta = 0;
let gamma = 0;

window.addEventListener("deviceorientation", evt => {
  alpha = evt.alpha;
  beta = evt.beta;
  gamma = evt.gamma;
});

window.addEventListener(
  "devicemotion",
  ({ acceleration, accelerationIncludingGravity }) => {
    const gx_s = accelerationIncludingGravity.x - acceleration.x;
    const gy_s = accelerationIncludingGravity.y - acceleration.y;
    const gz_s = accelerationIncludingGravity.z - acceleration.z;

    const [gx_e, gy_e, gz_e] = getEarthCoord(
      [gx_s, gy_s, gz_s],
      [alpha, beta, gamma]
    );

    const ax_s = -acceleration.x;
    const ay_s = -acceleration.y;
    const az_s = -acceleration.z;

    // const [ax_e, ay_e, az_e] = getEarthCoord([ax_s, ay_s, az_s], [0, beta, gamma]);
    const [ax_e, ay_e, az_e] = lpf.filter(
      getEarthCoord([ax_s, ay_s, az_s], [0, beta, gamma])
    );

    graph.addData("x", ax_e);
    graph.addData("y", ay_e);
    graph.addData("z", az_e);

    output.textContent = `
    ax_s: ${ax_s}
    ay_s: ${ay_s}
    az_s: ${az_s}
    ----
    ax_e: ${ax_e}
    ay_e: ${ay_e}
    az_e: ${az_e}
    ++++
    gx_s: ${gx_s}
    gy_s: ${gy_s}
    gz_s: ${gz_s}
    ----
    gx_e: ${gx_e}
    gy_e: ${gy_e}
    gz_e: ${gz_e}
    ++++
    alpha: ${alpha}
    beta: ${beta}
    gamma: ${gamma}
`;
  }
);

const filters = ["x", "y", "z"];
let current = 0;

graph.canvas.addEventListener("click", () => {
  if (current === filters.length) {
    current = 0;
    graph.filterCurve(filters);
  } else {
    graph.filterCurve([filters[current++]]);
  }
});

window.addEventListener("resize", () => {
  graph.resize(window.innerWidth, window.innerHeight);
});

document.body.style.margin = "0px";

if (DeviceMotionEvent.requestPermission) {
  document.addEventListener("click", async function ask() {
    await DeviceMotionEvent.requestPermission();

    document.removeEventListener("click", ask);
  });
}