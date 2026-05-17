import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { useApp } from './store';
import { TabBar } from './components/TabBar';
import { Today } from './screens/Today';
import { History } from './screens/History';
import { Stats } from './screens/Stats';
import { Settings } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';

export default function App() {
  const settings = useLiveQuery(() => db.settings.get('singleton'));
  const tab = useApp((s) => s.tab);
  const setTab = useApp((s) => s.setTab);

  // useLiveQuery returns undefined while loading; null/undefined record = no settings.
  if (settings === undefined) return null; // first render, no flash
  if (!settings) return <Onboarding />;

  return (
    <div style={{ paddingBottom: 'calc(var(--tabbar-h) + var(--safe-bottom))' }}>
      {tab === 'today' && <Today settings={settings} />}
      {tab === 'history' && <History settings={settings} />}
      {tab === 'stats' && <Stats settings={settings} />}
      {tab === 'settings' && <Settings settings={settings} />}
      <TabBar tab={tab} onSelect={setTab} />
    </div>
  );
}
