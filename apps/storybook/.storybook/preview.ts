import type { Preview } from "@storybook/react";
import "../src/styles/tailwind.css";

const preview: Preview = {
  parameters: {
    // The demos are drawn on a white surface with zinc ink. Naming it here
    // paints the canvas explicitly rather than inheriting whatever the
    // visitor's browser theme happens to be.
    backgrounds: {
      default: "surface",
      values: [
        { name: "surface", value: "#ffffff" },
        { name: "muted", value: "#fafafa" },
        { name: "ink", value: "#18181b" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
