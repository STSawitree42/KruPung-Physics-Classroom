import { describe, it, expect } from 'vitest';
import { QUESTION_CARDS, QUESTION_CATEGORIES } from '../../shared/data/questions';
import { SITUATION_CARDS } from '../../shared/data/situationCards';
import { SPECIAL_CARDS } from '../../shared/data/specialCards';
import { gradeSituation, sanitizeContent, validateQuestion, validateSpecial, publicWaveCard } from '../../shared/content';
import { defaultContent } from '../../shared/defaults';
import { DEFAULT_BOARD, validateBoard, emptyBoard } from '../../shared/board.config';
import { sanitizeSettings, DEFAULT_SETTINGS } from '../../shared/rules.config';

describe('question bank', () => {
  it('has at least 50 valid questions covering all 10 topics', () => {
    expect(QUESTION_CARDS.length).toBeGreaterThanOrEqual(50);
    expect(new Set(QUESTION_CARDS.map(q => q.id)).size).toBe(QUESTION_CARDS.length);
    QUESTION_CARDS.forEach(q => { const v = validateQuestion(q); expect(v.ok, q.id).toBe(true); });
    expect(new Set(QUESTION_CARDS.map(q => q.category))).toEqual(new Set(QUESTION_CATEGORIES));
    QUESTION_CATEGORIES.forEach(c => expect(QUESTION_CARDS.filter(q => q.category === c).length).toBeGreaterThanOrEqual(4));
  });
  it('every question has an explanation and points matching difficulty', () => {
    QUESTION_CARDS.forEach(q => { expect(q.explanation.length).toBeGreaterThan(10); expect(q.points).toBe({ easy: 2, medium: 3, hard: 4 }[q.difficulty]); });
  });
  it('rejects malformed questions', () => {
    expect(validateQuestion({ id: 'x1', text: 'q', choices: ['a', 'b', 'c'], answer: 0 }).ok).toBe(false);
    expect(validateQuestion({ id: 'x1', text: 'q', choices: ['a', 'b', 'c', 'd'], answer: 4 }).ok).toBe(false);
    expect(validateQuestion({ id: 'bad id', text: 'q', choices: ['a', 'b', 'c', 'd'], answer: 1 }).ok).toBe(false);
    expect(validateQuestion({ id: 'x1', text: 'q', choices: ['a', 'a', 'c', 'd'], answer: 1 }).ok).toBe(false);
  });
});

describe('original cards', () => {
  it('has the 20 situation cards and 10 original special cards', () => {
    expect(SITUATION_CARDS).toHaveLength(20);
    expect(SPECIAL_CARDS.filter(s => s.type !== 'GOOD_DEED')).toHaveLength(10);
    expect(SITUATION_CARDS.map(s => s.points)).toEqual([2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5]);
  });
  it('all default content validates without errors', () => {
    const { errors } = sanitizeContent(defaultContent());
    expect(errors).toEqual([]);
    SPECIAL_CARDS.forEach(s => expect(validateSpecial(s).ok, s.id).toBe(true));
  });
  it('ultrasound is graded as a mechanical longitudinal wave (physics correction)', () => {
    const us = SITUATION_CARDS.find(s => s.id === 's13')!;
    expect(gradeSituation(['longitudinal', 'mechanical'], us.answers)).toBe('full');
    expect(gradeSituation(['transverse', 'electromagnetic'], us.answers)).toBe('wrong');
  });
  it('public card views never contain answers', () => {
    SITUATION_CARDS.forEach(c => { const p = publicWaveCard(c) as unknown as Record<string, unknown>; expect(p.answers).toBeUndefined(); expect(p.explanation).toBeUndefined(); });
    QUESTION_CARDS.forEach(c => { const p = publicWaveCard(c) as unknown as Record<string, unknown>; expect(p.answer).toBeUndefined(); expect(p.explanation).toBeUndefined(); });
  });
  it('rejects special cards with unsafe/invalid effects', () => {
    expect(validateSpecial({ id: 'z', title: 't', text: 'x', type: 'PENALTY', effect: { op: 'move', steps: -99 } }).ok).toBe(false);
    expect(validateSpecial({ id: 'z', title: 't', text: 'x', type: 'PENALTY', effect: { op: 'hack' } }).ok).toBe(false);
    expect(validateSpecial({ id: 'z', title: 't', text: 'x', type: 'REWARD', effect: { op: 'choice', options: [{ label: 'a', effect: { op: 'score', amount: 5 } }] } }).ok).toBe(false);
  });
});

describe('grading', () => {
  const both = [['longitudinal', 'mechanical'], ['transverse', 'electromagnetic']] as const;
  it('full / partial / wrong', () => {
    expect(gradeSituation(['transverse', 'mechanical'], [['transverse', 'mechanical']])).toBe('full');
    expect(gradeSituation(['mechanical'], [['transverse', 'mechanical']])).toBe('partial');
    expect(gradeSituation(['mechanical', 'electromagnetic'], [['transverse', 'mechanical']])).toBe('wrong');
    expect(gradeSituation([], [['transverse', 'mechanical']])).toBe('wrong');
  });
  it('accepts alternative answer sets (radio = sound or radio wave)', () => {
    expect(gradeSituation(['longitudinal', 'mechanical'], both.map(a => [...a]))).toBe('full');
    expect(gradeSituation(['transverse', 'electromagnetic'], both.map(a => [...a]))).toBe('full');
    expect(gradeSituation(['transverse', 'mechanical'], both.map(a => [...a]))).toBe('wrong');
  });
  it('selecting all four types is never rewarded', () => {
    SITUATION_CARDS.forEach(c => expect(gradeSituation(['mechanical', 'electromagnetic', 'transverse', 'longitudinal'], c.answers)).toBe('wrong'));
  });
});

describe('board config', () => {
  it('matches the original board image: 36 cells + START + FINISH', () => {
    const b = DEFAULT_BOARD;
    expect(validateBoard(b)).toEqual({ ok: true, errors: [] });
    expect(b.cells).toHaveLength(38);
    expect(b.cells.filter(c => c.type === 'WAVE')).toHaveLength(16);
    expect(b.cells.filter(c => c.type === 'LIGHTNING')).toHaveLength(12);
    expect(b.cells.filter(c => c.type === 'NORMAL')).toHaveLength(8);
  });
  it('an empty custom board is not playable until all coordinates are set', () => {
    const b = emptyBoard(50);
    expect(b.cells).toHaveLength(52);
    const v = validateBoard(b);
    expect(v.ok).toBe(false);
    b.cells.forEach((c, i) => { c.x = i / 60; c.y = 0.5; });
    expect(validateBoard(b).ok).toBe(true);
  });
});

describe('settings', () => {
  it('clamps and ignores invalid values', () => {
    const s = sanitizeSettings({ maxPlayers: 99, answerSeconds: -5, waveDeck: 'evil', teacherConfirm: 'yes', winCondition: 'firstToFinish' });
    expect(s.maxPlayers).toBe(6);
    expect(s.answerSeconds).toBe(10);
    expect(s.waveDeck).toBe(DEFAULT_SETTINGS.waveDeck);
    expect(s.teacherConfirm).toBe(false);
    expect(s.winCondition).toBe('firstToFinish');
  });
});
