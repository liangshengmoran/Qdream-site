"use client";
import { Folder, FolderOpen, Lock } from '@gravity-ui/icons';
import { cn } from '@heroui/react';
import { type FC, memo, useCallback, useEffect, useRef, useState } from 'react';

type CategoryNavProps = {
  categories: App.Category[];
}

const MAX_DEPTH = 4;
const BORDER_COLORS = [
  'border-l-blue-400',
  'border-l-emerald-400',
  'border-l-amber-400',
  'border-l-rose-400',
];

const CategoryNavItem: FC<{ cat: App.Category; activeId: string; onClick: (id: string) => void; depth: number }> = memo(({
  cat, activeId, onClick, depth
}) => {
  const hasChildren = !!(cat.children && cat.children.length > 0);
  const [expanded, setExpanded] = useState(true);
  const isActive = activeId === cat.id;
  const borderColor = depth > 0 ? BORDER_COLORS[Math.min(depth - 1, MAX_DEPTH - 1)] : '';

  return (
    <li className={cn(depth > 0 && "ml-3 pl-3", depth > 0 && borderColor, depth > 0 && "border-l-2")}>
      <div
        className={cn(
          "flex items-center gap-1 py-1 cursor-pointer rounded px-1.5 -ml-1 transition-colors text-sm",
          isActive
            ? "text-accent font-medium bg-accent/5"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
        )}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded)
          onClick(cat.id)
        }}
      >
        {cat.private ? (
          <Lock className="size-3.5 shrink-0 text-danger" />
        ) : hasChildren && expanded ? (
          <FolderOpen className="size-3.5 shrink-0 text-accent" />
        ) : (
          <Folder className="size-3.5 shrink-0" />
        )}
        <span className="truncate">{cat.name}</span>
      </div>
      {hasChildren && expanded && (
        <ul>
          {cat.children!.map((child) => (
            <CategoryNavItem key={child.id} cat={child} activeId={activeId} onClick={onClick} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
});

const CategoryNav: FC<CategoryNavProps> = ({ categories }) => {
  const [activeId, setActiveId] = useState<string>('');
  const activeRef = useRef('');
  const rafRef = useRef<number>();

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = undefined
        const sections = document.querySelectorAll('[data-category-id]');
        let current = '';
        sections.forEach((section) => {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 120) current = section.getAttribute('data-category-id') || '';
        });
        if (current && current !== activeRef.current) {
          activeRef.current = current;
          setActiveId(current);
        }
      })
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.querySelector(`[data-category-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  if (!categories.length) return null;

  return (
    <nav className="w-52 shrink-0 hidden lg:block">
      <div className="sticky top-20">
        <h2 className="text-sm font-bold mb-2 px-1">分类目录</h2>
        <ul className="flex flex-col max-h-[calc(100vh-160px)] overflow-y-auto scrollbar-thin pr-1">
          {categories.map((cat) => (
            <CategoryNavItem key={cat.id} cat={cat} activeId={activeId} onClick={scrollTo} depth={0} />
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default CategoryNav;
