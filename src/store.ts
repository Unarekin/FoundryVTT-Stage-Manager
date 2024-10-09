import * as MiniRX from 'mini-rx-store';
import api from "./api";

const store: MiniRX.Store = MiniRX.configureStore({

  extensions: [
    new MiniRX.ReduxDevtoolsExtension({
      name: "Stage Manager Store",
      maxAge: 25,
      latency: 1000
    }),
    new MiniRX.ImmutableStateExtension(),
    ...(__DEV__ ? [new MiniRX.LoggerExtension()] : [])
  ]
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
(api as any).store = store;