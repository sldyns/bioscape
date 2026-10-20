const output = document.querySelector("#result");
let frame = document.querySelector("#app");
const root = new URL("../index.html", location.href);
root.hash =
  "#/cell?view=process&process=secretion&s=%7B%22v%22%3A1%2C%22lang%22%3A%22zh%22%2C%22mode%22%3A%22section%22%2C%22explode%22%3A60%2C%22labels%22%3Afalse%2C%22contracted%22%3Afalse%2C%22camera%22%3A%7B%22direction%22%3A%5B-0.58514%2C0.76341%2C0.27352%5D%2C%22target%22%3A%5B0%2C0.05%2C0%5D%2C%22zoom%22%3A0.44877%7D%2C%22process%22%3A%7B%22progress%22%3A1%2C%22speed%22%3A1%2C%22parameters%22%3A%7B%7D%2C%22annotations%22%3Atrue%7D%2C%22origin%22%3A%7B%22mode%22%3A%22section%22%2C%22explode%22%3A60%2C%22labels%22%3Afalse%2C%22contracted%22%3Afalse%7D%7D";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function stable() {
  const end = performance.now() + 30000;
  let last = "",
    count = 0;
  while (performance.now() < end) {
    const doc = frame.contentDocument;
    const host = doc?.querySelector(
      '.process-canvas[data-process="secretion"]',
    );
    const canvas = host?.querySelector("canvas");
    if (host?.getAttribute("aria-busy") === "false" && canvas) {
      const r = canvas.getBoundingClientRect();
      const value = {
        css: [r.width, r.height],
        buffer: [canvas.width, canvas.height],
        dpr: frame.contentWindow.devicePixelRatio,
        viewport: [
          frame.contentWindow.innerWidth,
          frame.contentWindow.innerHeight,
        ],
      };
      const key = JSON.stringify(value);
      count = key === last ? count + 1 : 0;
      last = key;
      if (count >= 6) return value;
    }
    await pause(80);
  }
  throw Error("Responsive scene did not stabilize");
}
(async () => {
  try {
    frame.style.width = "1280px";
    frame.style.height = "720px";
    frame.src = root.href;
    const wide = await stable();
    frame.style.width = "390px";
    frame.style.height = "844px";
    const resized = await stable();
    const freshFrame = document.createElement("iframe");
    freshFrame.id = "app";
    freshFrame.title = "Real BioScape process page";
    freshFrame.style.cssText = frame.style.cssText;
    frame.replaceWith(freshFrame);
    frame = freshFrame;
    frame.src = root.href;
    const fresh = await stable();
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const checks = [
      {
        pass:
          wide.viewport[0] === 1280 &&
          resized.viewport[0] === 390 &&
          fresh.viewport[0] === 390,
        message: "Actual wide and narrow document viewports exercised",
      },
      {
        pass: same(resized.css, fresh.css),
        message: "Resized and fresh narrow canvas CSS dimensions match",
      },
      {
        pass: same(resized.buffer, fresh.buffer),
        message: "Resized and fresh narrow native drawing buffers match",
      },
      {
        pass: wide.dpr === resized.dpr && resized.dpr === fresh.dpr,
        message: "Native DPR remains unchanged",
      },
      {
        pass: fresh.buffer.every(
          (v, i) => v === Math.floor(fresh.css[i] * Math.min(fresh.dpr, 2)),
        ),
        message: "Fresh drawing buffer follows actual CSS and original DPR cap",
      },
    ];
    output.textContent = JSON.stringify({
      status: checks.every((c) => c.pass) ? "PASS" : "FAIL",
      checks,
      wide,
      resized,
      fresh,
    });
  } catch (error) {
    output.textContent = JSON.stringify({
      status: "ERROR",
      error: String(error),
    });
  }
})();
