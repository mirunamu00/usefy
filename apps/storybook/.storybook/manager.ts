import { addons } from "@storybook/manager-api";
import { create } from "@storybook/theming/create";

const theme = create({
  base: "light",
  brandTitle: "Usefy",
  brandUrl: "https://github.com/geon0529/usefy",
  brandTarget: "_blank",
});

addons.setConfig({
  theme,
});
