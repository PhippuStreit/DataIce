import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('Home page', () => {
  it('renders the fixed Glace form heading and main flow', () => {
    render(<HomePage />);

    expect(screen.getByText(/dein gratis-glace/i)).toBeInTheDocument();
    expect(screen.getByText(/wer bist du\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /weiter/i })).toBeInTheDocument();
  });
});
