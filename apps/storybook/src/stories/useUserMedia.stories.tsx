import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { useUserMedia, isUserMediaSupported } from "@usefy/use-user-media";
import { storyTheme } from "../styles/storyTheme";

// ============================================================================
// Meta
//
// Nothing here opens a camera on load. `getUserMedia` shows a permission
// prompt, and a prompt nobody asked for is both rude and the fastest way to be
// denied permanently — so every story waits for a click.
// ============================================================================

const meta: Meta = {
  title: "Hooks/useUserMedia",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `Camera and microphone streams — \`getUserMedia\` lifecycle, device switching, torch, and a teardown you can rely on.

\`getUserMedia\` looks like a one-line API and is not. The stream has to be released on unmount or the camera light stays on. Device labels are invisible until permission has been granted once. Switching cameras means tearing down and re-acquiring. Every browser words its failures differently, and "NotReadableError" means nothing to a user.

## Features
- **Teardown you can rely on** — every track stopped on unmount, on \`stop()\`, and when a stream is replaced, *including* a stream that arrives after the component unmounted
- **Race-safe** — a superseded request releases its stream instead of quietly re-opening the camera
- **Honest states** — \`idle · prompting · granted · denied · unsupported · error\`; \`prompting\` is separate so a UI never covers the permission dialog with "camera unavailable"
- **Actionable errors** — every \`DOMException\` normalized to a reason with a message a user can act on
- **Devices and torch** — enumerate, cycle, or open one by id; torch is capability-probed and reports failure rather than lying
- **Opt-in** — nothing opens until you call \`start()\`

## Basic Usage
\`\`\`tsx
import { useUserMedia } from "@usefy/use-user-media";

const camera = useUserMedia({ facingMode: "environment" });

<video ref={(el) => el && (el.srcObject = camera.stream)} autoPlay playsInline muted />;
<button onClick={camera.start}>Start camera</button>;
\`\`\``,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "granted"
      ? "bg-emerald-100 text-emerald-800"
      : status === "denied" || status === "error"
        ? "bg-red-100 text-red-800"
        : status === "prompting"
          ? "bg-amber-100 text-amber-800"
          : "bg-zinc-100 text-zinc-700";

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${tone}`}
      data-testid="status"
    >
      {status}
    </span>
  );
}

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Press Start and the browser asks for permission. Nothing happens before that. Whatever you do next — allow, deny, close the tab — every track is released.",
      },
    },
  },
  render: function CameraLifecycle() {
    const camera = useUserMedia({ facingMode: "environment" });
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

    useEffect(() => {
      if (videoElement) videoElement.srcObject = camera.stream;
    }, [videoElement, camera.stream]);

    return (
      <div className={storyTheme.container}>
        <h3 className={storyTheme.title}>useUserMedia</h3>
        <p className={storyTheme.subtitle}>
          The camera stays closed until you ask for it.
        </p>

        <div className="mb-4 flex items-center gap-3">
          <StatusPill status={camera.status} />
          {!camera.isSupported && (
            <span className="text-sm text-zinc-500">
              This browser cannot open a camera here.
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-md bg-zinc-900" style={{ maxWidth: 360 }}>
          <video
            ref={setVideoElement}
            autoPlay
            playsInline
            muted
            aria-label="Camera preview"
            className="block h-full w-full"
            style={{ aspectRatio: "4 / 3", objectFit: "cover" }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={storyTheme.buttonPrimary}
            data-testid="start"
            onClick={() => void camera.start()}
          >
            Start
          </button>
          <button
            type="button"
            className={storyTheme.buttonNeutral}
            data-testid="stop"
            onClick={camera.stop}
          >
            Stop
          </button>
          {camera.devices.length > 1 && (
            <button
              type="button"
              className={storyTheme.buttonNeutral}
              data-testid="switch"
              onClick={() => void camera.switchDevice()}
            >
              Flip camera
            </button>
          )}
          {camera.isTorchSupported && (
            <button
              type="button"
              className={storyTheme.buttonNeutral}
              data-testid="torch"
              onClick={() => void camera.setTorch(!camera.torch)}
            >
              {camera.torch ? "Torch off" : "Torch on"}
            </button>
          )}
        </div>

        {camera.error && (
          <div className={`${storyTheme.cardError} mt-4`} data-testid="error">
            <p className="m-0 text-sm font-semibold text-red-900">
              {camera.error.reason}
            </p>
            <p className="mt-1 mb-0 text-sm text-red-800">{camera.error.message}</p>
          </div>
        )}

        <dl className={`${storyTheme.card} mt-5 grid grid-cols-2 gap-x-4 gap-y-1 text-sm`}>
          <dt className="font-semibold">isSupported</dt>
          <dd className="m-0 font-mono">{String(camera.isSupported)}</dd>
          <dt className="font-semibold">cameras</dt>
          <dd className="m-0 font-mono" data-testid="device-count">
            {camera.devices.length}
          </dd>
          <dt className="font-semibold">activeDeviceId</dt>
          <dd className="m-0 truncate font-mono text-xs">{camera.activeDeviceId ?? "—"}</dd>
          <dt className="font-semibold">torch</dt>
          <dd className="m-0 font-mono">
            {camera.isTorchSupported ? String(camera.torch) : "unsupported"}
          </dd>
        </dl>
      </div>
    );
  },
};

// ============================================================================
// Interaction test — NOT in autodocs. It drives a flow on open, which a demo
// story must never do.
// ============================================================================

export const InteractionTest: Story = {
  tags: ["!autodocs"],
  parameters: {
    docs: { description: { story: "Automated checks. Not a demo — it runs itself." } },
  },
  render: function Harness() {
    const camera = useUserMedia();
    return (
      <div className={storyTheme.container}>
        <p data-testid="supported">{String(isUserMediaSupported())}</p>
        <p data-testid="status">{camera.status}</p>
        <p data-testid="has-stream">{String(camera.stream !== null)}</p>
        <button type="button" data-testid="start" onClick={() => void camera.start()}>
          Start
        </button>
        <button type="button" data-testid="stop" onClick={camera.stop}>
          Stop
        </button>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("nothing is acquired before it is asked for", async () => {
      expect(canvas.getByTestId("status")).toHaveTextContent(/idle|unsupported/);
      expect(canvas.getByTestId("has-stream")).toHaveTextContent("false");
    });

    await step("start settles into a definite state", async () => {
      await userEvent.click(canvas.getByTestId("start"));
      // Headless Chrome grants a fake device; a browser without one reports a
      // typed failure. Either is a settled state — what must never happen is
      // staying stuck on `prompting`.
      await waitFor(
        () => expect(canvas.getByTestId("status")).toHaveTextContent(/granted|denied|error|unsupported/),
        { timeout: 6000 },
      );
    });

    await step("stop releases and returns to idle", async () => {
      await userEvent.click(canvas.getByTestId("stop"));
      await waitFor(() => {
        expect(canvas.getByTestId("has-stream")).toHaveTextContent("false");
        expect(canvas.getByTestId("status")).toHaveTextContent(/idle|unsupported/);
      });
    });
  },
};
