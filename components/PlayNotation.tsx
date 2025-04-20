'use client';

import { memo, useEffect, useRef } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

interface PlayNotationProps {
  /** MusicXML 字符串 */
  musicXML: string;
  
  /** 当前演奏的 MIDI 音符编号 */
  currentNoteIndex?: number;
  
  /** 可选 CSS 类名 */
  className?: string;
}

/**
 * PlayNotation 组件
 * 
 * 演奏时高亮正在演奏的音符，其他音符半透明
 * - 当前音符: 不透明 (opacity: 1)
 * - 其他音符: 半透明 (opacity: 0.2)
 * - 不演奏时: 所有音符显示 (opacity: 1)
 */
function PlayNotation({
  musicXML,
  currentNoteIndex,
  className = '',
}: PlayNotationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  // 初始化 OSMD 并渲染谱子
  useEffect(() => {
    if (!containerRef.current || !musicXML) return;

    const container = containerRef.current;

    const loadNotation = () => {
      // 清理旧实例
      if (osmdRef.current) {
        try {
          osmdRef.current.clear();
        } catch {
          // 忽略错误
        }
        osmdRef.current = null;
      }

      const osmd = new OpenSheetMusicDisplay(container, {
        drawTitle: false,
        followCursor: false,
        autoResize: true,
        drawMeasureNumbers: false,
        backend: 'svg',
        drawingParameters: 'compacttight',
        drawPartNames: false,
        drawPartAbbreviations: false,
        drawCredits: false,
      });

      osmdRef.current = osmd;

      osmd.load(musicXML)
        .then(() => {
          if (osmdRef.current === osmd && container.isConnected) {
            osmd.setLogLevel('error');
            osmd.zoom = 1.0;
            osmd.render();

            const svg = container.querySelector('svg');
            if (svg) {
              svg.style.maxWidth = '100%';
              svg.style.height = 'auto';
            }
          }
        })
        .catch((err) => {
          console.error('Failed to render notation:', err);
        });
    };

    loadNotation();
  }, [musicXML]);

  // 根据 currentNoteIndex 更新音符透明度
  useEffect(() => {
    if (!osmdRef.current || !containerRef.current) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    try {
      // 获取所有音符组
      let noteGroups = Array.from(svg.querySelectorAll('g.vf-stavenote')) as SVGGElement[];

      // 备用方案：从有颜色的音符头获取
      if (noteGroups.length === 0) {
        const coloredHeads = Array.from(svg.querySelectorAll('path'))
          .filter(p => {
            const fill = p.getAttribute('fill');
            return fill && fill.startsWith('#') && fill !== '#000000';
          });
        const fromHeads = coloredHeads
          .map(h => h.closest('g'))
          .filter((g): g is SVGGElement => !!g);
        // 去重同时保持顺序
        const seen = new Set<SVGGElement>();
        for (const g of fromHeads) {
          if (!seen.has(g)) seen.add(g);
        }
        noteGroups = Array.from(seen);
      }

      if (currentNoteIndex !== undefined && currentNoteIndex >= 0) {
        // 演奏中：只高亮当前音符
        noteGroups.forEach((g, i) => {
          g.style.opacity = i === currentNoteIndex ? '1' : '0.2';
        });
      } else {
        // 未演奏：显示所有音符
        noteGroups.forEach(g => {
          g.style.opacity = '1';
        });
      }
    } catch (error) {
      console.error('Error updating note opacity:', error);
    }
  }, [currentNoteIndex]);

  return (
    <div ref={containerRef} className={className} />
  );
}

export default memo(PlayNotation);
