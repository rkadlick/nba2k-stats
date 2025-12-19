import { useState, useMemo } from 'react';

export type TabType = 'games' | 'seasonTotals' | 'awards' | 'careerHighs' | 'playoffTree' | 'roster';

interface Tab {
  id: TabType;
  label: string;
}

const DEFAULT_TABS: Tab[] = [
  { id: 'games', label: 'Games' },
  { id: 'seasonTotals', label: 'Season Totals' },
  { id: 'roster', label: 'Roster' },
  { id: 'awards', label: 'League Awards' },
  { id: 'playoffTree', label: 'Playoff Tree' },
  { id: 'careerHighs', label: 'Career Highs' },
];

interface UseTabStateProps {
  defaultTab?: TabType;
  tabs?: Tab[];
}

export function useTabState({ defaultTab = 'games', tabs = DEFAULT_TABS }: UseTabStateProps = {}) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  const tabsList = useMemo(() => tabs, [tabs]);

  return {
    activeTab,
    setActiveTab,
    tabs: tabsList,
  };
}
