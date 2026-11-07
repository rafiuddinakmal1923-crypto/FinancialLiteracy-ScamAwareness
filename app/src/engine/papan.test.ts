import { describe, expect, it } from 'vitest';
import { rankClassmates } from './papan';

const place = (grade: number) => rankClassmates(grade).findIndex((r) => r.player);

describe('rankClassmates', () => {
  it('has 9 classmates and one player', () => {
    const rows = rankClassmates(65.5);
    expect(rows).toHaveLength(10);
    expect(rows.filter((r) => r.player)).toEqual([{ id: 'player', grade: 65.5, player: true }]);
  });

  it('sorts highest first', () => {
    const grades = rankClassmates(65.5).map((r) => r.grade);
    expect(grades).toEqual([...grades].sort((a, b) => b - a));
  });

  it('places the player at grades 0, 65.5 and 100', () => {
    expect(place(0)).toBe(9);
    expect(place(65.5)).toBe(5);
    expect(place(100)).toBe(0);
  });

  it('places the player above a classmate on a tie', () => {
    expect(place(67)).toBe(4);
  });
});
