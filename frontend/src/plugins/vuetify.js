import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import { VNumberInput } from "vuetify/lib/labs/components.mjs";

const vuetify = createVuetify({
  components: {
    ...components,
    VNumberInput,
  },
  directives,
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
});

export default vuetify;