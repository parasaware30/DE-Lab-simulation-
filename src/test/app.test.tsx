import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

describe('DE-Lab Pro App Integration Tests', () => {
  it('renders application brand and navigation elements', () => {
    render(<App />);
    expect(screen.getAllByText(/DE-Lab/i)[0]).toBeDefined();
    expect(screen.getAllByText(/Pro/i)[0]).toBeDefined();
  });

  it('navigates to Logic Gates Simulator module', () => {
    render(<App />);
    const gateButtons = screen.getAllByText(/Logic Gates/i);
    fireEvent.click(gateButtons[0]);
    expect(screen.getAllByText(/Logic Gate Simulator/i).length).toBeGreaterThan(0);
  });

  it('navigates to Boolean Algebra Solver module', () => {
    render(<App />);
    const boolButtons = screen.getAllByText(/Boolean Solver/i);
    fireEvent.click(boolButtons[0]);
    expect(screen.getAllByText(/Boolean Algebra Solver/i).length).toBeGreaterThan(0);
  });

  it('navigates to Combinational Circuits Lab module', () => {
    render(<App />);
    const combButtons = screen.getAllByText(/Combinational/i);
    fireEvent.click(combButtons[0]);
    expect(screen.getAllByText(/Combinational Logic Circuits/i).length).toBeGreaterThan(0);
  });

  it('navigates to Number Systems & Radix Converter module', () => {
    render(<App />);
    const numButtons = screen.getAllByText(/Number Systems/i);
    fireEvent.click(numButtons[0]);
    expect(screen.getAllByText(/Number Systems & Arithmetic/i).length).toBeGreaterThan(0);
  });
});
