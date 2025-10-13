import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';

describe('Smoke Tests', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('renders CollabCanvas heading', () => {
    render(<App />);
    expect(screen.getByText('CollabCanvas')).toBeInTheDocument();
  });

  it('environment setup is working', () => {
    expect(import.meta.env.VITE_APP_ENV).toBeDefined();
  });
});

