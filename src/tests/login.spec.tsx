import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {LoginScreen} from '../components/LoginScreen';

const renderLogin = (initialPhoneNumber = '') => {
  const onSubmit = vi.fn();
  const utils = render(
    <LoginScreen
      initialPhoneNumber={initialPhoneNumber}
      onSubmit={onSubmit}
      onHowItWorks={vi.fn()}
      customLogoUrl={null}
      onOpenLogoCustomizer={vi.fn()}
    />,
  );
  return {...utils, onSubmit};
};

describe('LoginScreen', () => {
  it('keeps "Get OTP" disabled until a 10-digit number is entered', () => {
    const {onSubmit} = renderLogin('');
    const button = screen.getByRole('button', {name: /get otp/i});
    const input = document.querySelector('input[type="tel"]') as HTMLInputElement;

    expect(button).toBeDisabled();

    fireEvent.change(input, {target: {value: '93350'}});
    expect(button).toBeDisabled();

    fireEvent.change(input, {target: {value: '9335010032'}});
    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(onSubmit).toHaveBeenCalledWith('9335010032');
  });

  it('strips non-digit characters from the phone input', () => {
    renderLogin('');
    const input = document.querySelector('input[type="tel"]') as HTMLInputElement;

    fireEvent.change(input, {target: {value: '+91 93350-10032x'}});

    expect(input.value).toBe('91933501003'.slice(0, 10));
    expect(input.value).toMatch(/^\d{10}$/);
  });
});
