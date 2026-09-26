import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import Layout from '../components/Layout';

describe('Layout Component', () => {
  beforeEach(() => {
    localStorage.setItem(
      'user',
      JSON.stringify({ name: 'Alex Manager', role: 'manager' })
    );
  });

  it('renders brand logo and title', () => {
    render(
      <BrowserRouter>
        <Layout title="Dashboard Test">
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('StockSense')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Test')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders all operations sidebar navigation items', () => {
    render(
      <BrowserRouter>
        <Layout title="Nav Test">
          <div />
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Receipts')).toBeInTheDocument();
    expect(screen.getByText('Deliveries')).toBeInTheDocument();
    expect(screen.getByText('Transfers')).toBeInTheDocument();
    expect(screen.getByText('Adjustments')).toBeInTheDocument();
    expect(screen.getByText('Warehouses')).toBeInTheDocument();
    expect(screen.getByText('Move History')).toBeInTheDocument();
  });

  it('displays user profile information and role badge', () => {
    render(
      <BrowserRouter>
        <Layout title="User Test">
          <div />
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('Alex Manager')).toBeInTheDocument();
    expect(screen.getByText('manager')).toBeInTheDocument();
  });
});
