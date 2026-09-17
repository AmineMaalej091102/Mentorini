import type { ComponentType } from 'react';
import { 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  Code, 
  Server, 
  Brain 
} from 'lucide-react';
import { Category, CategoryInfo } from '../types';

interface CategoryFilterProps {
  categories: CategoryInfo[];
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  mentorCounts: Record<Category, number>;
}

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Sparkles,
  GraduationCap,
  BookOpen,
  Code,
  Server,
  Brain,
};

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  mentorCounts,
}: CategoryFilterProps) {
  return (
    <div className="px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Filtri b l-Domaine
        </h2>
        <span className="text-[11px] text-zinc-700 dark:text-zinc-400 font-medium">
          {mentorCounts[selectedCategory] || 0} Mentors
        </span>
      </div>

      {/* Horizontally scrollable pill tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
        {categories.map((cat) => {
          const IconComponent = ICONS[cat.iconName] || Sparkles;
          const isSelected = selectedCategory === cat.id;
          const count = mentorCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isSelected
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-zinc-700 text-white dark:bg-zinc-200 dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
