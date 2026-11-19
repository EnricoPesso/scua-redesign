// Só para os testes: o pacote `use-sync-external-store` é CommonJS e, dentro de
// design-system/node_modules, faria `require('react')` apontar para o React de lá (dois Reacts,
// "dispatcher null"). Como o app usa React 19, o hook nativo basta.
// `useSyncExternalStoreWithSelector` só é chamado pelo base-ui em React < 19.
import { useMemo, useSyncExternalStore } from 'react';

export { useSyncExternalStore };

export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (aoMudar: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
): Selection {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot ?? getSnapshot);
  return useMemo(() => selector(snapshot), [snapshot, selector]);
}
