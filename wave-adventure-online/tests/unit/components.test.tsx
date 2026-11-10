// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { WaveTypeChooser, Scoreboard } from '../../src/components/game';
import { toCsv, parseCsv } from '../../src/utils/csv';
import { started } from './helpers';
import type { WaveType } from '../../shared/types';

vi.mock('../../src/game/sound', () => ({ sfx: new Proxy({}, { get: () => () => {} }), getPrefs: () => ({ sound: false, reduceMotion: true }) }));

function Chooser() { const [v, setV] = useState<WaveType[]>([]); return <><WaveTypeChooser value={v} onChange={setV} /><output data-testid="sel">{v.join(',')}</output></>; }

describe('WaveTypeChooser', () => {
  it('lets a team select more than one wave-type card and toggle them off', () => {
    render(<Chooser />);
    fireEvent.click(screen.getByRole('button', { name: /คลื่นกล/ }));
    fireEvent.click(screen.getByRole('button', { name: /คลื่นตามขวาง/ }));
    expect(screen.getByTestId('sel').textContent).toBe('mechanical,transverse');
    expect(screen.getByRole('button', { name: /คลื่นกล/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /คลื่นกล/ }));
    expect(screen.getByTestId('sel').textContent).toBe('transverse');
  });
});

describe('Scoreboard', () => {
  it('shows every team in turn order with score and position', () => {
    const { doc } = started();
    doc.public.players.u2.score = 12;
    render(<Scoreboard room={doc.public} me="u1" />);
    expect(screen.getByText('ทีม1')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('คุณ')).toBeInTheDocument();
  });
});

describe('CSV export', () => {
  it('adds a UTF-8 BOM, escapes quotes and blocks formula injection', () => {
    const csv = toCsv([['ชื่อ', 'คะแนน'], ['ทีม "A"', 5], ['=HYPERLINK("x")', 1]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"ทีม ""A"""');
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(parseCsv(csv)[1]).toEqual(['ทีม "A"', '5']);
  });
});
