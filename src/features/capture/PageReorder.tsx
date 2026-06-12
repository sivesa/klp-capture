/**
 * PageReorder.tsx
 *
 * Drag-and-drop page reordering using Sortable.js.
 * Rendered as a horizontal scrollable strip inside CameraPage.
 * Each tile shows: thumbnail, page number, rotate button, delete button.
 */
import React, { useEffect, useRef } from 'react';
import Sortable from 'sortablejs';
import type { CapturedPage } from '../../types';

interface Props {
  pages:     CapturedPage[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRotate:  (id: string) => void;
  onDelete:  (id: string) => void;
}

const PageReorder: React.FC<Props> = ({ pages, onReorder, onRotate, onDelete }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const sorted  = [...pages].sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (!listRef.current) return;
    const sortable = Sortable.create(listRef.current, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: evt => {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
          onReorder(evt.oldIndex, evt.newIndex);
        }
      },
    });
    return () => sortable.destroy();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={listRef} style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
      {sorted.map(page => (
        <div key={page.id} data-id={page.id} style={{
          position: 'relative', flexShrink: 0, width: 72, height: 92,
          borderRadius: 10, overflow: 'hidden',
          border: '2px solid rgba(0,191,166,0.15)',
          background: 'rgba(26,46,82,0.7)', cursor: 'grab',
          transform: `rotate(${page.rotation}deg)`, transition: 'transform 0.3s',
          userSelect: 'none',
        }}>
          {page.localUri
            ? <img src={page.localUri} alt={`Page ${page.order + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 28, pointerEvents: 'none' }}>📄</div>
          }

          {/* Page number */}
          <span style={{ position: 'absolute', bottom: 3, right: 3,
            background: 'rgba(0,0,0,0.75)', borderRadius: 4,
            padding: '1px 5px', fontSize: 9, fontWeight: 700, color: '#fff' }}>
            {page.order + 1}
          </span>

          {/* Rotate */}
          <button onClick={() => onRotate(page.id)} style={{
            position: 'absolute', top: 3, left: 3, width: 20, height: 20,
            background: 'rgba(0,0,0,0.6)', borderRadius: '50%', border: 'none',
            cursor: 'pointer', fontSize: 11, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>↻</button>

          {/* Delete */}
          <button onClick={() => onDelete(page.id)} style={{
            position: 'absolute', top: 3, right: 3, width: 20, height: 20,
            background: 'var(--klp-rose)', borderRadius: '50%', border: 'none',
            cursor: 'pointer', fontSize: 12, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
      ))}
    </div>
  );
};

export default PageReorder;
