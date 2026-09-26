import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '../components/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders "done" status with proper badge class', () => {
    render(<StatusBadge status="done" />);
    const badge = screen.getByText(/done/i);
    expect(badge).toBeInTheDocument();
    expect(badge.closest('.badge')).toHaveClass('badge-done');
  });

  it('renders "ready" status with proper badge class', () => {
    render(<StatusBadge status="ready" />);
    const badge = screen.getByText(/ready/i);
    expect(badge).toBeInTheDocument();
    expect(badge.closest('.badge')).toHaveClass('badge-ready');
  });

  it('renders "waiting" status with proper badge class', () => {
    render(<StatusBadge status="waiting" />);
    const badge = screen.getByText(/waiting/i);
    expect(badge).toBeInTheDocument();
    expect(badge.closest('.badge')).toHaveClass('badge-waiting');
  });

  it('defaults to "draft" if status is missing or undefined', () => {
    render(<StatusBadge status={null} />);
    const badge = screen.getByText(/draft/i);
    expect(badge).toBeInTheDocument();
    expect(badge.closest('.badge')).toHaveClass('badge-draft');
  });
});
