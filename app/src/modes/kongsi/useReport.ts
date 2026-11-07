// The report model for the current save, shared by Papan Markah (W5) and Kad Keputusan (W6).
import { useMemo } from 'react';
import { scenarios } from 'virtual:celik-content';
import { BALANCE } from '../../engine/balance';
import { reportModel, type ReportModel } from '../../engine/report';
import { useGame } from '../../state/game';

export function useReport(): ReportModel {
  const week = useGame((s) => s.week);
  const results = useGame((s) => s.results);
  const meters = useGame((s) => s.meters);
  const incomeTotal = useGame((s) => s.incomeTotal);
  const goal = useGame((s) => s.goal);
  return useMemo(
    () => reportModel({ week, results, meters, incomeTotal, goal }, BALANCE.start.duit, scenarios),
    [week, results, meters, incomeTotal, goal],
  );
}
