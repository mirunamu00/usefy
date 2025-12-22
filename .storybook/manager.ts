import { addons } from "storybook/manager-api";
import { create } from "storybook/theming/create";

addons.setConfig({
  theme: create({
    base: "dark",
    brandTitle: "usefy playground",
    brandUrl: "https://github.com/your-username/usefy",
    // brandImage: './logo.svg', // 선택사항
  }),
});
