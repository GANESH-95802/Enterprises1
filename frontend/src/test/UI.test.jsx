import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, StatCard, Badge, EmptyState, Loading, Modal, FormField } from '../components/ui';
import { FiUsers } from 'react-icons/fi';

describe('UI Components', () => {
  it('renders Card with children', () => {
    render(<Card><div>Card content</div></Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders StatCard with label and value', () => {
    render(<StatCard icon={FiUsers} label="Users" value="42" />);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders Badge with variant', () => {
    render(<Badge variant="success">Active</Badge>);
    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('badge-success');
  });

  it('renders EmptyState', () => {
    render(<EmptyState icon={FiUsers} title="No items" message="Add some items" />);
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Add some items')).toBeInTheDocument();
  });

  it('renders Loading with text', () => {
    render(<Loading text="Processing..." />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders Modal when open', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        <p>Modal body</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();
  });

  it('does not render Modal when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden Modal">
        <p>Should not show</p>
      </Modal>
    );
    expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();
  });

  it('renders FormField with label and error', () => {
    render(
      <FormField label="Email" error="Required" required>
        <input aria-label="Email" />
      </FormField>
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});