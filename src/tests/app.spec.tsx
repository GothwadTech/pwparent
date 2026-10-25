import {render} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import App from '../App';

describe('App (build smoke test)', () => {
  it('mounts and renders the splash screen without crashing', () => {
    const {container, unmount} = render(<App />);

    expect(container.firstElementChild).not.toBeNull();
    expect(container.innerHTML.length).toBeGreaterThan(200);

    // The splash screen auto-advances after 2.8s — unmount immediately so no
    // setState lands after the test finishes.
    unmount();
  });

  it('does not render raw template placeholders', () => {
    const {container, unmount} = render(<App />);
    const html = container.innerHTML;

    expect(html).not.toContain('MY_FIREBASE_');
    expect(html).not.toContain('import.meta.env');
    expect(html).not.toContain('[object Object]');

    unmount();
  });
});
