import React from 'react';
import { useCategories } from '../hooks/useCategories';

interface SubNavProps {
  selectedCategory: string;
  onCategoryClick: (categoryId: string) => void;
}

const SubNav: React.FC<SubNavProps> = ({ selectedCategory, onCategoryClick }) => {
  const { categories, loading } = useCategories();

  const chip = (active: boolean) =>
    `px-5 py-2 text-xs transition-all duration-300 border uppercase tracking-widest font-bold whitespace-nowrap active:scale-95 ${
      active
        ? 'bg-teamax-gold text-black border-teamax-gold shadow-gold scale-105'
        : 'bg-transparent text-teamax-secondary border-teamax-gold/30 hover:border-teamax-gold hover:text-teamax-gold'
    }`;

  return (
    <div className="sticky top-24 z-40 bg-black/95 backdrop-blur-md border-b border-teamax-gold/20 shadow-xl px-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 overflow-x-auto py-3 scrollbar-hide">
          {loading ? (
            <div className="flex space-x-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 w-20 bg-teamax-light rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <button onClick={() => onCategoryClick('all')} className={chip(selectedCategory === 'all')}>
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCategoryClick(c.id)}
                  className={`${chip(selectedCategory === c.id)} flex items-center space-x-2`}
                >
                  <span className="text-base">{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SubNav);
