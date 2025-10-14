import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertyPanel from '../../../src/components/Canvas/PropertyPanel';
import { Timestamp } from 'firebase/firestore';
import type { Shape } from '../../../src/utils/types';

describe('PropertyPanel', () => {
  const mockShape: Shape = {
    id: 'test-shape-1',
    type: 'rectangle',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    fill: '#cccccc',
    stroke: '#000000',
    strokeWidth: 2,
    opacity: 100,
    cornerRadius: 0,
    createdBy: 'user-1',
    createdAt: Timestamp.now(),
    lastModifiedBy: 'user-1',
    lastModifiedAt: Timestamp.now(),
    isLocked: false,
    lockedBy: null,
    lockedAt: null,
  };

  let mockOnUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdate = vi.fn();
  });

  it('renders nothing when no shape is selected', () => {
    const { container } = render(
      <PropertyPanel shape={null} onUpdate={mockOnUpdate} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders property panel when shape is selected', () => {
    render(<PropertyPanel shape={mockShape} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('Shape Properties')).toBeInTheDocument();
    expect(screen.getByText('rectangle')).toBeInTheDocument();
  });

  it('displays fill color picker', () => {
    render(<PropertyPanel shape={mockShape} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('Fill Color')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#CCCCCC')).toBeInTheDocument();
  });

  it('calls onUpdate when fill color changes', () => {
    render(<PropertyPanel shape={mockShape} onUpdate={mockOnUpdate} />);

    const fillInput = screen.getByDisplayValue('#CCCCCC');
    fireEvent.change(fillInput, { target: { value: '#ff0000' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({ fill: '#ff0000' });
  });

  it('displays border toggle', () => {
    render(<PropertyPanel shape={mockShape} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('Border')).toBeInTheDocument();
    expect(screen.getByText('On')).toBeInTheDocument(); // Border is on by default
  });

  it('toggles border on/off', () => {
    render(<PropertyPanel shape={mockShape} onUpdate={mockOnUpdate} />);

    const toggleButton = screen.getByText('On');
    fireEvent.click(toggleButton);

    expect(mockOnUpdate).toHaveBeenCalledWith({ stroke: undefined });
  });

  it('displays opacity slider', () => {
    render(<PropertyPanel shape={mockShape} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('Opacity: 100%')).toBeInTheDocument();
  });

  it('calls onUpdate when opacity changes', () => {
    const { container } = render(<PropertyPanel shape={mockShape} onUpdate={mockOnUpdate} />);

    // Find opacity slider by its attributes
    const opacitySlider = container.querySelector('input[type="range"][min="0"][max="100"]');
    expect(opacitySlider).toBeTruthy();
    
    fireEvent.change(opacitySlider!, { target: { value: '50' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({ opacity: 50 });
  });

  it('displays corner radius slider for rectangles', () => {
    render(<PropertyPanel shape={mockShape} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('Corner Radius: 0px')).toBeInTheDocument();
  });

  it('does not display corner radius slider for circles', () => {
    const circleShape: Shape = {
      ...mockShape,
      type: 'circle',
      radius: 50,
    };

    render(<PropertyPanel shape={circleShape} onUpdate={mockOnUpdate} />);

    expect(screen.queryByText(/Corner Radius:/)).not.toBeInTheDocument();
  });

  it('calls onUpdate when corner radius changes', () => {
    const { container } = render(<PropertyPanel shape={mockShape} onUpdate={mockOnUpdate} />);

    // Find corner radius slider by its attributes
    const radiusSlider = container.querySelector('input[type="range"][min="0"][max="50"]');
    expect(radiusSlider).toBeTruthy();
    
    fireEvent.change(radiusSlider!, { target: { value: '25' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({ cornerRadius: 25 });
  });

  it('updates local state when shape changes', () => {
    const { rerender } = render(
      <PropertyPanel shape={mockShape} onUpdate={mockOnUpdate} />
    );

    expect(screen.getByDisplayValue('#CCCCCC')).toBeInTheDocument();

    const newShape: Shape = {
      ...mockShape,
      id: 'test-shape-2',
      fill: '#ff0000',
    };

    rerender(<PropertyPanel shape={newShape} onUpdate={mockOnUpdate} />);

    expect(screen.getByDisplayValue('#FF0000')).toBeInTheDocument();
  });

  it('displays real-time sync indicator', () => {
    render(<PropertyPanel shape={mockShape} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('Changes sync in real-time')).toBeInTheDocument();
  });
});

