import {render} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import App from '../App';

describe('App (build smoke test)', () => {
  it('mounts and renders a usable first screen without crashing', () => {
    const {container, unmount} = render(<App />);

    expect(container.firstElementChild).not.toBeNull();
    expect(container.innerHTML.length).toBeGreaterThan(200);

    // There is no splash screen any more: the first paint is already onboarding
    // or login, and nothing auto-advances on a timer.
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
