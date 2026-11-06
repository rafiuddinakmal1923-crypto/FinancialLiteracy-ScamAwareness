import { navigate } from '../../shell/router';
import { FakePage } from './FakePage';

/**
 * Route `#/laman/:url`: one in-game fake page on its own (screenshots, drills). Inside a scenario the page opens as
 * an overlay on the chat instead (`ui:link`). Either button goes back home; nothing is recorded.
 */
export function FakePageScreen({ params }: { params: Record<string, string> }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper">
      <FakePage url={params.url ?? ''} onDone={() => navigate('/home')} />
    </div>
  );
}
