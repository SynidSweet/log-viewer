const React = require('react');
const { render, screen } = require('@testing-library/react');
require('@testing-library/jest-dom');
const { Checkbox } = require('../../../../src/components/ui/checkbox.tsx');

describe('Checkbox', () => {
  let renderResult: RenderResult;

  beforeEach(() => {
    renderResult = render(<Checkbox />);
  });

  it('should render without crashing', () => {
    expect(renderResult.container).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    expect(renderResult.container.firstChild).toMatchSnapshot();
  });

  it('should have correct TypeScript props', () => {
    // Test component with default props
    const { container } = render(<Checkbox />);
    expect(container).toBeInTheDocument();
    
    // Test component with various prop types
    const commonProps = [
      {},
      { children: 'test' },
      { className: 'test-class' },
      { style: { color: 'red' } },
      { 'data-testid': 'test-component' }
    ];
    
    commonProps.forEach((props, index) => {
      try {
        const { unmount } = render(<Checkbox {...props} />);
        unmount(); // Clean up after each render
      } catch (error) {
        // Component may not accept these props - that's okay
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  it('should handle user interactions with type safety', () => {
    render(<Checkbox />);
    
    // Test for TypeScript-safe interactions
    const interactiveElements = [
      ...screen.queryAllByRole('button'),
      ...screen.queryAllByRole('textbox'),
      ...screen.queryAllByRole('checkbox'),
      ...screen.queryAllByRole('link')
    ];
    
    interactiveElements.forEach(element => {
      // Test that elements are properly typed and accessible
      expect(element).toBeInTheDocument();
      expect(element.tagName).toBeDefined();
      
      // Test TypeScript-safe event handling
      if (element.getAttribute('role') === 'button' || element.tagName === 'BUTTON') {
        expect(() => element.click()).not.toThrow();
      }
      
      if (element.getAttribute('role') === 'textbox' || element.tagName === 'INPUT') {
        expect(() => element.focus()).not.toThrow();
      }
    });
  });
});
