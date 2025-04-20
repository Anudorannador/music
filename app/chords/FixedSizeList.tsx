import { useCallback, useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { List } from 'react-window';
import type { ListProps } from 'react-window';
import type { ListItemAriaAttributes } from './ChordRow';

export type FixedSizeListChildProps = {
  index: number;
  style: CSSProperties;
  ariaAttributes: ListItemAriaAttributes;
};

export type FixedSizeListProps = {
  height: number;
  width: number;
  itemCount: number;
  itemSize: number;
  overscanCount?: number;
  className?: string;
  children: (props: FixedSizeListChildProps) => ReactNode;
};

type RowProps = {
  renderRow: (props: FixedSizeListChildProps) => ReactNode;
};

export default function FixedSizeList({
  height,
  width,
  itemCount,
  itemSize,
  overscanCount = 3,
  className,
  children,
}: FixedSizeListProps) {
  const rowProps = useMemo<RowProps>(() => ({ renderRow: children }), [children]);

  const rowComponent = useCallback<ListProps<RowProps>['rowComponent']>(
    ({ index, style, ariaAttributes, renderRow }) => {
      return renderRow({ index, style, ariaAttributes: ariaAttributes as ListItemAriaAttributes });
    },
    []
  );

  return (
    <List
      className={className}
      style={{ height, width }}
      defaultHeight={height}
      overscanCount={overscanCount}
      rowCount={itemCount}
      rowHeight={itemSize}
      rowComponent={rowComponent}
      rowProps={rowProps}
    />
  );
}
