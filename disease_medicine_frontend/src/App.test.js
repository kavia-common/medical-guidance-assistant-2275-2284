import { render, screen } from '@testing-library/react';
import App from './App';

test('renders main sections', () => {
  render(<App />);
  expect(screen.getByText(/Disease Medicine Assistant/i)).toBeInTheDocument();
  expect(screen.getByText(/1\) Select Disease/i)).toBeInTheDocument();
  expect(screen.getByText(/2\) Recommended Medicines/i)).toBeInTheDocument();
  expect(screen.getByText(/3\) Ask for Explanation/i)).toBeInTheDocument();
});
