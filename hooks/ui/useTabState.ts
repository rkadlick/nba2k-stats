import { useState, useMemo } from 'react';

export type TabType = 'games' | 'seasonTotals' | 'awards' | 'careerHighs' | 'playoffTree';

interface Tab {
  id: TabType;
  label: string;
}

const DEFAULT_TABS: Tab[] = [
  { id: 'games', label: 'Games' },
  { id: 'seasonTotals', label: 'Season Totals' },
  { id: 'awards', label: 'League Awards' },
  { id: 'careerHighs', label: 'Career Highs' },
  { id: 'playoffTree', label: 'Playoff Tree' },
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
