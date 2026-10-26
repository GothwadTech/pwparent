import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {AppHeader} from '../components/AppHeader';
import {SettingsDock} from '../components/SettingsDock';
import {SupportHelpCentreView} from '../components/SupportHelpCentreView';
import {isDockUnlockQuery, normalizeDockQuery} from '../lib/dockAccess';

/**
 * The floating backend pill is GONE; the settings panel opens from exactly two
 * doors. These tests pin both doors, the "admin" search rule, and the fact that
 * nothing floats on screen any more.
 */
describe('dock access rule: typing "admin" in any case unlocks', () => {
  it('matches however a parent types it', () => {
    for (const query of ['admin', 'ADMIN', 'Admin', '  admin  ', 'ad min', 'admin panel', 'ADMINISTRATOR']) {
      expect(isDockUnlockQuery(query)).toBe(true);
    }
  });

  it('never fires for unrelated queries', () => {
    for (const query of ['', 'payment failed', 'papa', 'adm', 'batch change']) {
      expect(isDockUnlockQuery(query)).toBe(false);
    }
  });

  it('normalises case and punctuation away', () => {
    expect(normalizeDockQuery('Ad-Min Panel!')).toBe('adminpanel');
  });
});

describe('door 1: the (i) button left of "How it works"', () => {
  it('renders the info button and it opens the panel', () => {
    const onOpenSettings = vi.fn();
    render(<AppHeader showHowItWorks onHowItWorksClick={vi.fn()} onOpenSettings={onOpenSettings} />);

    const door = screen.getByLabelText('App info and settings');
    fireEvent.click(door);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('sits to the LEFT of the "How it works" button', () => {
    const {container} = render(
      <AppHeader showHowItWorks onHowItWorksClick={vi.fn()} onOpenSettings={vi.fn()} />,
    );

    const door = screen.getByLabelText('App info and settings');
    const howItWorks = screen.getByText('How it works');
    // Same row, and the door comes first in document order.
    expect(door.parentElement).toBe(howItWorks.parentElement);
    expect(
      door.compareDocumentPosition(howItWorks) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelector('header')).not.toBeNull();
  });

  it('stays absent when the owner offers no settings door', () => {
    render(<AppHeader showHowItWorks onHowItWorksClick={vi.fn()} />);
    expect(screen.queryByLabelText('App info and settings')).toBeNull();
  });
});

describe('door 2: the Help Centre search bar', () => {
  it('reveals the access button only once "admin" is typed', () => {
    const onOpenSettings = vi.fn();
    render(<SupportHelpCentreView onOpenSettings={onOpenSettings} />);

    expect(screen.queryByText('Admin access')).toBeNull();

    const search = screen.getByPlaceholderText('Type your query here...');
    fireEvent.change(search, {target: {value: 'ADMIN'}});
    const door = screen.getByText('Admin access');

    fireEvent.click(door);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('hides again for an unrelated query', () => {
    render(<SupportHelpCentreView onOpenSettings={vi.fn()} />);
    const search = screen.getByPlaceholderText('Type your query here...');

    fireEvent.change(search, {target: {value: 'admin'}});
    expect(screen.getByText('Admin access')).not.toBeNull();

    fireEvent.change(search, {target: {value: 'payment failed'}});
    expect(screen.queryByText('Admin access')).toBeNull();
  });
});

const dockProps = (open: boolean, onClose = vi.fn()) => ({
  open,
  onClose,
  backend: null,
  mode: 'mock' as const,
  uid: 'u1',
  phone: '9876543210',
  admin: null,
  configError: null,
  onOpenAdmin: vi.fn(),
  onSwitchNumber: vi.fn(),
  onSignOut: vi.fn(),
});

describe('the panel itself: controlled, and nothing floats', () => {
  it('renders nothing at all while closed', () => {
    const {container} = render(<SettingsDock {...dockProps(false)} />);
    expect(container.innerHTML).toBe('');
  });

  it('has NO floating trigger anywhere — the two doors are the only way in', () => {
    const {container} = render(<SettingsDock {...dockProps(true)} />);

    // The old pill's label is gone for good.
    expect(screen.queryByLabelText('Open settings')).toBeNull();
    expect(container.querySelector('.fixed.bottom-3.right-3')).toBeNull();

    // …but the panel itself is alive.
    expect(screen.getByText('Settings')).not.toBeNull();
  });

  it('closes through its own close button', () => {
    const onClose = vi.fn();
    render(<SettingsDock {...dockProps(true, onClose)} />);

    fireEvent.click(screen.getByLabelText('Close settings'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('still shows the session facts and the read budget', () => {
    render(<SettingsDock {...dockProps(true)} />);

    expect(screen.getByText(/Firestore reads/i)).not.toBeNull();
    expect(screen.getByText(/\+91 9876543210/)).not.toBeNull();
  });
});
