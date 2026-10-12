import { render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';

import { useElementWidth } from './useElementWidth';

describe(useElementWidth.name, () => {
  it('reports the element width once it is mounted', () => {
    render(<Probe />);

    // vitest.setup.ts gives every element a client/offset width of 800 under happy-dom.
    expect(screen.getByTestId('probe')).toHaveTextContent('800');
  });
});

function Probe() {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  return (
    <div ref={ref}>
      <span data-testid="probe">{width}</span>
    </div>
  );
}
