import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ColorPicker from '../../../src/components/UI/ColorPicker';

describe('ColorPicker', () => {
  it('renders with initial color', () => {
    render(
      <ColorPicker
        label="Test Color"
        value="#ff0000"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Test Color')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#FF0000')).toBeInTheDocument();
  });

  it('calls onChange when color input changes', () => {
    const handleChange = vi.fn();
    render(
      <ColorPicker
        label="Test Color"
        value="#ff0000"
        onChange={handleChange}
      />
    );

    const colorInput = screen.getByDisplayValue('#FF0000');
    fireEvent.change(colorInput, { target: { value: '#00ff00' } });

    expect(handleChange).toHaveBeenCalledWith('#00ff00');
  });

  it('validates hex color format in text input', () => {
    const handleChange = vi.fn();
    render(
      <ColorPicker
        label="Test Color"
        value="#ff0000"
        onChange={handleChange}
      />
    );

    const textInput = screen.getByDisplayValue('#FF0000');
    
    // Valid hex color
    fireEvent.change(textInput, { target: { value: '#00FF00' } });
    expect(handleChange).toHaveBeenCalledWith('#00FF00');

    // Invalid hex color (should not call onChange)
    handleChange.mockClear();
    fireEvent.change(textInput, { target: { value: 'invalid' } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('disables inputs when disabled prop is true', () => {
    render(
      <ColorPicker
        label="Test Color"
        value="#ff0000"
        onChange={vi.fn()}
        disabled={true}
      />
    );

    const textInput = screen.getByDisplayValue('#FF0000');
    expect(textInput).toBeDisabled();
  });

  it('displays color swatch with correct background', () => {
    const { container } = render(
      <ColorPicker
        label="Test Color"
        value="#ff0000"
        onChange={vi.fn()}
      />
    );

    const swatch = container.querySelector('[style*="background-color"]');
    expect(swatch).toHaveStyle({ backgroundColor: '#ff0000' });
  });
});

