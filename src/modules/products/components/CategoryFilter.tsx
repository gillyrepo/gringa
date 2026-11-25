import { cn } from '@/shared/lib/utils';
import { ScrollArea, ScrollBar } from '@/shared/components/ui/scroll-area';

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
  categories: { id: string; label: string }[];
}

export function CategoryFilter({ selected, onSelect, categories }: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-3">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0',
            selected === null
              ? 'gradient-gold text-primary-foreground shadow-gold'
              : 'bg-secondary text-secondary-foreground hover:bg-muted'
          )}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            type="button"
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0',
              selected === category.id
                ? 'gradient-gold text-primary-foreground shadow-gold'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            )}
          >
            {category.label}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
