import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

const originalEnv = process.env;

beforeEach(() => {
  // Mock the process.env object
  jest.resetModules();
  process.env = { ...originalEnv, REACT_APP_DEFAULT_URL: 'http://example.com/example.js' };
});

afterEach(() => {
  // Restore the original process.env object
  process.env = originalEnv;
});


test('renders url file file name is in document', () => {
  render(<App />);
  const linkElement = screen.getByText(/example.js/i);
  expect(linkElement).toBeInTheDocument();
});
